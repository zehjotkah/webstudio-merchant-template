/**
 * Customer accounts for the Webstudio × Merchant shop.
 *
 * Merchant's order and customer APIs require the admin key, which must never reach a browser.
 * This Worker holds that key and exposes only what a signed-in customer may see:
 *
 *   POST /auth/request   { email }        → emails a one-time sign-in link (always answers ok)
 *   POST /auth/verify    { token }        → exchanges the link token for a 30-day session
 *   POST /auth/logout    Bearer <session> → ends the session
 *   GET  /me/orders      Bearer <session> → the signed-in customer's orders
 *   GET  /checkout/order ?session_id=cs_… → order summary for the confirmation page
 *   POST /hooks/merchant                 → Merchant's signed order.created webhook: sends the
 *                                          order confirmation and the shop owner's notification
 *   GET  /                               → status; on first visit also registers that webhook
 *
 * Sessions are bearer tokens kept in localStorage by the site's bridge script; cookies would be
 * third-party here (the site and this Worker live on different domains) and Safari blocks them.
 */

type SendEmail = {
  send(message: {
    from: { email: string; name: string };
    to: string;
    subject: string;
    html: string;
    text: string;
  }): Promise<{ messageId: string }>;
};

type Env = {
  DB: D1Database;
  /** Service binding to the Merchant Worker. Workers on one account can't fetch each other's workers.dev URLs. */
  MERCHANT?: Fetcher;
  EMAIL?: SendEmail;
  /** Only needed without the MERCHANT service binding (Merchant on another account or host). */
  MERCHANT_URL?: string;
  MERCHANT_ADMIN_KEY: string;
  SHOP_NAME: string;
  SITE_ORIGIN: string;
  /** Extra origins allowed to call this Worker, comma separated (staging, local preview). */
  ALLOWED_ORIGINS?: string;
  MAIL_FROM?: string;
  /** Where "new order" emails go. Leave empty to skip them. */
  SHOP_INBOX?: string;
  /** Link to the Merchant admin in "new order" emails. */
  ADMIN_URL?: string;
  /** Optional override; normally the Worker registers the webhook itself and keeps the secret in D1. */
  MERCHANT_WEBHOOK_SECRET?: string;
  /** "true" returns the sign-in link in the response instead of emailing it. Never enable in production. */
  DEV_RETURN_LINK?: string;
};

const LINK_TTL_MS = 15 * 60 * 1000;
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_LINKS_PER_EMAIL = 3;
const MAX_LINKS_PER_IP = 10;

const encoder = new TextEncoder();

const sha256 = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
};

const randomToken = () => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const normalizeEmail = (value: unknown) =>
  typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())
    ? value.trim().toLowerCase()
    : null;

const allowedOrigins = (env: Env) =>
  new Set([env.SITE_ORIGIN, ...(env.ALLOWED_ORIGINS ?? '').split(',')].map((o) => o.trim()).filter(Boolean));

const json = (body: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } });

/* ------------------------------ Storage ------------------------------ */

// Deploy buttons create the D1 database but don't run SQL files, so the Worker creates its own
// tables on first use (once per isolate).
let schemaReady: Promise<unknown> | null = null;
const ensureSchema = (env: Env) =>
  (schemaReady ??= env.DB.batch([
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS login_tokens (token_hash TEXT PRIMARY KEY, email TEXT NOT NULL, ip_hash TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, used_at INTEGER)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS login_tokens_email ON login_tokens (email, created_at)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS login_tokens_ip ON login_tokens (ip_hash, created_at)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS sessions (session_hash TEXT PRIMARY KEY, email TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL)`),
    env.DB.prepare(`CREATE INDEX IF NOT EXISTS sessions_expires ON sessions (expires_at)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS webhook_deliveries (delivery_id TEXT PRIMARY KEY, received_at INTEGER NOT NULL)`),
    env.DB.prepare(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)`),
  ]).catch((error) => { schemaReady = null; throw error; }));

const getSetting = async (env: Env, key: string) =>
  (await env.DB.prepare(`SELECT value FROM settings WHERE key = ?`).bind(key).first<{ value: string }>())?.value ?? null;

/* ------------------------------ Merchant ------------------------------ */

type MerchantAddress = {
  line1: string; line2?: string | null; city: string; state?: string | null; postal_code: string; country: string;
} | null;

type MerchantOrder = {
  id: string;
  number: string;
  status: string;
  customer_email: string;
  shipping?: { name: string | null; phone: string | null; address: MerchantAddress };
  amounts: { subtotal_cents: number; discount_cents?: number; shipping_cents: number; tax_cents: number; total_cents: number; currency: string };
  discount?: { code: string; amount_cents: number } | null;
  tracking: { number: string | null; url: string | null; shipped_at: string | null };
  stripe: { checkout_session_id: string | null };
  items: { sku: string; title: string; qty: number; unit_price_cents: number }[];
  created_at: string;
};

const merchant = async <T>(env: Env, path: string, body?: unknown): Promise<T> => {
  // Through the service binding the host is irrelevant; the request goes straight to the Merchant Worker.
  const request = new Request((env.MERCHANT ? 'https://merchant' : env.MERCHANT_URL) + path, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Bearer ${env.MERCHANT_ADMIN_KEY}`, accept: 'application/json', ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const res = await (env.MERCHANT ? env.MERCHANT.fetch(request) : fetch(request));
  if (!res.ok) throw new Error(`Merchant ${path}: ${res.status}`);
  return res.json() as Promise<T>;
};

const addressLines = (name: string | null | undefined, a: MerchantAddress) =>
  a ? [name, a.line1, a.line2, `${a.city}${a.state ? `, ${a.state}` : ''} ${a.postal_code}`, a.country].filter(Boolean) as string[] : [];

/** Only the fields a customer should see; Merchant's internal ids and Stripe ids stay here. */
const publicOrder = (order: MerchantOrder) => ({
  number: order.number,
  status: order.status,
  placedAt: order.created_at,
  currency: order.amounts.currency,
  total: { cents: order.amounts.total_cents, currency: order.amounts.currency },
  amounts: {
    subtotal: order.amounts.subtotal_cents,
    discount: order.discount?.amount_cents ?? order.amounts.discount_cents ?? 0,
    shipping: order.amounts.shipping_cents,
    tax: order.amounts.tax_cents,
    total: order.amounts.total_cents,
  },
  items: order.items.map((i) => ({ title: i.title, qty: i.qty, unitCents: i.unit_price_cents, lineCents: i.unit_price_cents * i.qty })),
  shippingAddress: addressLines(order.shipping?.name, order.shipping?.address ?? null),
  trackingNumber: order.tracking?.number ?? null,
  trackingUrl: order.tracking?.url ?? null,
});

/* ------------------------------ Email ------------------------------ */

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const mailFrom = (env: Env) => ({ email: env.MAIL_FROM || `hello@${new URL(env.SITE_ORIGIN).hostname}`, name: env.SHOP_NAME });

const money = (cents: number, currency: string) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);

/** One email layout for every message: shop name, content, optional button, footer note. */
const emailLayout = (env: Env, body: string, button?: { href: string; label: string }, note = '') => `<!doctype html><html><body style="margin:0;background:#f7f5f2;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#2b2724">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td style="font-family:Georgia,serif;font-size:22px;font-weight:600;padding-bottom:20px">${escapeHtml(env.SHOP_NAME)}</td></tr>
<tr><td style="font-size:15px;line-height:1.6">${body}</td></tr>
${button ? `<tr><td style="padding-top:24px"><a href="${escapeHtml(button.href)}" style="display:inline-block;background:#a4502a;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:10px">${escapeHtml(button.label)}</a></td></tr>` : ''}
${note ? `<tr><td style="padding-top:24px;font-size:13px;line-height:1.5;color:#6b635c">${note}</td></tr>` : ''}
</table></td></tr></table></body></html>`;

/** Items, totals and address as an email table plus a plain-text version. */
const orderSummary = (order: MerchantOrder) => {
  const c = order.amounts.currency;
  const rows = order.items.map((i) =>
    `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${i.qty} × ${escapeHtml(i.title)}</td><td align="right" style="padding:8px 0;border-bottom:1px solid #eee">${money(i.unit_price_cents * i.qty, c)}</td></tr>`).join('');
  const discount = order.discount?.amount_cents ?? order.amounts.discount_cents ?? 0;
  const totals = [
    ['Subtotal', order.amounts.subtotal_cents],
    ...(discount ? [[`Discount${order.discount?.code ? ` (${order.discount.code})` : ''}`, -discount]] : []),
    ['Shipping', order.amounts.shipping_cents],
    ...(order.amounts.tax_cents ? [['Tax', order.amounts.tax_cents]] : []),
  ] as [string, number][];
  const address = addressLines(order.shipping?.name, order.shipping?.address ?? null);
  const html = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}
${totals.map(([label, cents]) => `<tr><td style="padding:4px 0;color:#6b635c">${escapeHtml(label)}</td><td align="right" style="padding:4px 0;color:#6b635c">${cents ? money(cents, c) : 'Free'}</td></tr>`).join('')}
<tr><td style="padding:8px 0;font-weight:700">Total</td><td align="right" style="padding:8px 0;font-weight:700">${money(order.amounts.total_cents, c)}</td></tr></table>
${address.length ? `<p style="margin:20px 0 0;font-size:14px"><strong>Shipping to</strong><br>${address.map(escapeHtml).join('<br>')}</p>` : ''}`;
  const text = [
    ...order.items.map((i) => `${i.qty} × ${i.title}  ${money(i.unit_price_cents * i.qty, c)}`),
    ...totals.map(([label, cents]) => `${label}: ${cents ? money(cents, c) : 'Free'}`),
    `Total: ${money(order.amounts.total_cents, c)}`,
    ...(address.length ? ['', 'Shipping to:', ...address] : []),
  ].join('\n');
  return { html, text };
};

const sendOrderEmails = async (email: SendEmail, env: Env, order: MerchantOrder) => {
  const summary = orderSummary(order);
  const total = money(order.amounts.total_cents, order.amounts.currency);
  const sends: Promise<unknown>[] = [
    email.send({
      from: mailFrom(env),
      to: order.customer_email,
      subject: `Your ${env.SHOP_NAME} order ${order.number}`,
      html: emailLayout(env,
        `<p style="margin:0 0 16px">Thank you for your order! We've received your payment and are getting it ready.</p>
<p style="margin:0 0 20px;color:#6b635c">Order <strong style="color:#2b2724">${escapeHtml(order.number)}</strong></p>${summary.html}`,
        { href: `${env.SITE_ORIGIN}/account`, label: 'View your order' },
        'Sign in with this email address to see your orders and tracking at any time.'),
      text: `Thank you for your order ${order.number}!\n\n${summary.text}\n\nYour orders: ${env.SITE_ORIGIN}/account`,
    }),
  ];
  if (env.SHOP_INBOX) {
    sends.push(email.send({
      from: mailFrom(env),
      to: env.SHOP_INBOX,
      subject: `New order ${order.number} — ${total}`,
      html: emailLayout(env,
        `<p style="margin:0 0 16px">New paid order <strong>${escapeHtml(order.number)}</strong> from ${escapeHtml(order.customer_email)}.</p>${summary.html}`,
        env.ADMIN_URL ? { href: env.ADMIN_URL, label: 'Open Merchant admin' } : undefined),
      text: `New order ${order.number} from ${order.customer_email}\n\n${summary.text}`,
    }));
  }
  await Promise.all(sends);
};

const sendSignInLink = async (email: SendEmail, env: Env, to: string, link: string) => {
  const shop = env.SHOP_NAME;
  const safeLink = escapeHtml(link);
  await email.send({
    from: mailFrom(env),
    to,
    subject: `Your ${shop} sign-in link`,
    text: `Sign in to ${shop}:\n${link}\n\nThis link works once and expires in 15 minutes. If you didn't ask for it, you can ignore this email.`,
    html: `<!doctype html><html><body style="margin:0;background:#f7f5f2;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#2b2724">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table role="presentation" width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;padding:32px">
<tr><td style="font-family:Georgia,serif;font-size:22px;font-weight:600;padding-bottom:16px">${escapeHtml(shop)}</td></tr>
<tr><td style="font-size:16px;line-height:1.6;padding-bottom:24px">Click the button below to sign in and see your orders. The link works once and expires in 15 minutes.</td></tr>
<tr><td style="padding-bottom:24px"><a href="${safeLink}" style="display:inline-block;background:#a4502a;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 24px;border-radius:10px">Sign in to ${escapeHtml(shop)}</a></td></tr>
<tr><td style="font-size:13px;line-height:1.5;color:#6b635c">If you didn't ask for this email, you can safely ignore it.</td></tr>
</table></td></tr></table></body></html>`,
  });
};

/* ------------------------------ Handlers ------------------------------ */

const requestLink = async (request: Request, env: Env, origin: string) => {
  const body = (await request.json().catch(() => ({}))) as { email?: unknown };
  const email = normalizeEmail(body.email);
  if (!email) return json({ ok: false, error: 'invalid_email' }, 400);
  if (!env.EMAIL && env.DEV_RETURN_LINK !== 'true') return json({ ok: false, error: 'email_not_configured' }, 503);

  const now = Date.now();
  const ipHash = await sha256(request.headers.get('cf-connecting-ip') ?? 'unknown');
  const since = now - RATE_WINDOW_MS;
  const counts = await env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM login_tokens WHERE email = ?1 AND created_at > ?3) AS by_email,
       (SELECT COUNT(*) FROM login_tokens WHERE ip_hash = ?2 AND created_at > ?3) AS by_ip`,
  ).bind(email, ipHash, since).first<{ by_email: number; by_ip: number }>();
  if ((counts?.by_email ?? 0) >= MAX_LINKS_PER_EMAIL || (counts?.by_ip ?? 0) >= MAX_LINKS_PER_IP) {
    return json({ ok: false, error: 'rate_limited' }, 429, { 'retry-after': '900' });
  }

  const token = randomToken();
  await env.DB.prepare(
    `INSERT INTO login_tokens (token_hash, email, ip_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)`,
  ).bind(await sha256(token), email, ipHash, now, now + LINK_TTL_MS).run();

  // The token travels in the URL fragment, so it never reaches server logs or Referer headers.
  const link = `${origin}/account/verify#token=${token}`;
  if (env.DEV_RETURN_LINK === 'true' || !env.EMAIL) return json({ ok: true, devLink: link });
  await sendSignInLink(env.EMAIL, env, email, link);
  // Same answer whether or not the address has ever ordered: no account enumeration.
  return json({ ok: true });
};

const verifyLink = async (request: Request, env: Env) => {
  const body = (await request.json().catch(() => ({}))) as { token?: unknown };
  if (typeof body.token !== 'string' || body.token.length < 20 || body.token.length > 100) {
    return json({ ok: false, error: 'invalid_token' }, 400);
  }
  const now = Date.now();
  const tokenHash = await sha256(body.token);
  // Single use: only the request that flips used_at gets a session.
  const claimed = await env.DB.prepare(
    `UPDATE login_tokens SET used_at = ?1 WHERE token_hash = ?2 AND used_at IS NULL AND expires_at > ?1 RETURNING email`,
  ).bind(now, tokenHash).first<{ email: string }>();
  if (!claimed) return json({ ok: false, error: 'expired_or_used' }, 400);

  const session = randomToken();
  const expiresAt = now + SESSION_TTL_MS;
  await env.DB.prepare(`INSERT INTO sessions (session_hash, email, created_at, expires_at) VALUES (?, ?, ?, ?)`)
    .bind(await sha256(session), claimed.email, now, expiresAt).run();
  return json({ ok: true, session, email: claimed.email, expiresAt: new Date(expiresAt).toISOString() });
};

const sessionEmail = async (request: Request, env: Env) => {
  const auth = request.headers.get('authorization') ?? '';
  const session = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (session.length < 20 || session.length > 100) return null;
  const row = await env.DB.prepare(`SELECT email FROM sessions WHERE session_hash = ? AND expires_at > ?`)
    .bind(await sha256(session), Date.now()).first<{ email: string }>();
  return row?.email ?? null;
};

const logout = async (request: Request, env: Env) => {
  const auth = request.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ')) {
    await env.DB.prepare(`DELETE FROM sessions WHERE session_hash = ?`).bind(await sha256(auth.slice(7))).run();
  }
  return json({ ok: true });
};

const myOrders = async (request: Request, env: Env) => {
  const email = await sessionEmail(request, env);
  if (!email) return json({ ok: false, error: 'unauthorized' }, 401);
  const list = await merchant<{ items: MerchantOrder[] }>(env, `/v1/orders?email=${encodeURIComponent(email)}&limit=50`);
  return json({ ok: true, email, orders: list.items.map(publicOrder) });
};

const checkoutOrder = async (url: URL, env: Env) => {
  const sessionId = url.searchParams.get('session_id') ?? '';
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(sessionId)) return json({ ok: false, error: 'invalid_session' }, 400);
  // Orders are written by Merchant's Stripe webhook; recent orders are enough to find a fresh checkout.
  const list = await merchant<{ items: MerchantOrder[] }>(env, `/v1/orders?limit=50`);
  const order = list.items.find((o) => o.stripe?.checkout_session_id === sessionId);
  if (!order) return json({ ok: true, pending: true });
  return json({ ok: true, pending: false, order: { ...publicOrder(order), email: order.customer_email } });
};

/** Merchant signs the raw body with HMAC-SHA256 (hex) using the webhook's secret. */
const validSignature = async (secret: string, body: string, signature: string) => {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = [...new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(body)))]
    .map((b) => b.toString(16).padStart(2, '0')).join('');
  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
};

/** Registers this Worker for Merchant's order.created webhook once and keeps the secret in D1. */
const ensureOrderWebhook = async (env: Env, origin: string) => {
  if (env.MERCHANT_WEBHOOK_SECRET || (await getSetting(env, 'merchant_webhook_secret'))) return 'registered';
  if (!env.MERCHANT_ADMIN_KEY || (!env.MERCHANT && !env.MERCHANT_URL)) return 'merchant_not_configured';
  const created = await merchant<{ id: string; secret: string }>(env, '/v1/webhooks', {
    url: `${origin}/hooks/merchant`,
    events: ['order.created'],
  });
  await env.DB.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES ('merchant_webhook_secret', ?), ('merchant_webhook_id', ?)`)
    .bind(created.secret, created.id).run();
  return 'registered';
};

const merchantWebhook = async (request: Request, env: Env) => {
  const secret = env.MERCHANT_WEBHOOK_SECRET || (await getSetting(env, 'merchant_webhook_secret'));
  if (!secret) return json({ ok: false, error: 'webhook_not_configured' }, 503);
  const body = await request.text();
  const signature = request.headers.get('x-merchant-signature') ?? '';
  if (!(await validSignature(secret, body, signature))) return json({ ok: false, error: 'invalid_signature' }, 401);

  const event = JSON.parse(body) as { id: string; type: string; data: { order?: MerchantOrder } };
  if (event.type !== 'order.created' || !event.data.order) return json({ ok: true, ignored: event.type });

  // Merchant retries failed deliveries; send each order's emails once.
  const first = await env.DB.prepare(`INSERT OR IGNORE INTO webhook_deliveries (delivery_id, received_at) VALUES (?, ?)`)
    .bind(event.id, Date.now()).run();
  if (!first.meta.changes) return json({ ok: true, duplicate: true });

  if (!env.EMAIL) return json({ ok: true, emailed: false });
  try {
    await sendOrderEmails(env.EMAIL, env, event.data.order);
  } catch (error) {
    // Let Merchant retry: forget this delivery so the retry is not treated as a duplicate.
    await env.DB.prepare(`DELETE FROM webhook_deliveries WHERE delivery_id = ?`).bind(event.id).run();
    throw error;
  }
  return json({ ok: true, emailed: true });
};

/* ------------------------------ Router ------------------------------ */

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    await ensureSchema(env);
    const origin = request.headers.get('origin');
    const originAllowed = !!origin && allowedOrigins(env).has(origin);
    const cors: Record<string, string> = originAllowed
      ? {
          'access-control-allow-origin': origin!,
          'access-control-allow-methods': 'GET, POST, OPTIONS',
          'access-control-allow-headers': 'authorization, content-type',
          'access-control-max-age': '86400',
          vary: 'Origin',
        }
      : {};

    if (request.method === 'OPTIONS') return new Response(null, { status: originAllowed ? 204 : 403, headers: cors });
    // Merchant's webhook is server-to-server and authenticated by its signature instead.
    if (request.method === 'POST' && url.pathname === '/hooks/merchant') {
      try { return await merchantWebhook(request, env); }
      catch (error) { console.error(error); return json({ ok: false, error: 'server_error' }, 500); }
    }
    // Browsers always send Origin on cross-site POSTs; refuse ones from sites we don't serve.
    if (request.method === 'POST' && !originAllowed) return json({ ok: false, error: 'forbidden_origin' }, 403);

    let response: Response;
    try {
      const route = `${request.method} ${url.pathname}`;
      if (route === 'POST /auth/request') response = await requestLink(request, env, originAllowed ? origin! : env.SITE_ORIGIN);
      else if (route === 'POST /auth/verify') response = await verifyLink(request, env);
      else if (route === 'POST /auth/logout') response = await logout(request, env);
      else if (route === 'GET /me/orders') response = await myOrders(request, env);
      else if (route === 'GET /checkout/order') response = await checkoutOrder(url, env);
      else if (route === 'GET /') {
        const webhook = await ensureOrderWebhook(env, url.origin).catch((error) => `failed: ${error.message}`);
        response = json({ ok: true, service: 'account', email: env.EMAIL ? 'configured' : 'not_configured', orderEmails: webhook });
      }
      else response = json({ ok: false, error: 'not_found' }, 404);
    } catch (error) {
      console.error(error);
      response = json({ ok: false, error: 'server_error' }, 500);
    }
    for (const [k, v] of Object.entries(cors)) response.headers.set(k, v);
    return response;
  },

  async scheduled(_event: ScheduledEvent, env: Env) {
    await ensureSchema(env);
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM login_tokens WHERE expires_at < ?`).bind(now - 24 * 60 * 60 * 1000),
      env.DB.prepare(`DELETE FROM sessions WHERE expires_at < ?`).bind(now),
      env.DB.prepare(`DELETE FROM webhook_deliveries WHERE received_at < ?`).bind(now - 30 * 24 * 60 * 60 * 1000),
    ]);
  },
};
