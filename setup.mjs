#!/usr/bin/env node
// One-time setup for a freshly deployed Merchant (Webstudio × Merchant shop template).
//
//   curl -fsSL https://raw.githubusercontent.com/zehjotkah/webstudio-merchant-template/main/setup.mjs \
//     | node - https://webstudio-merchant.YOUR-SUBDOMAIN.workers.dev
//
// 1. Creates Merchant's API keys (public pk_… and admin sk_…). Works only once per store.
// 2. Creates the Stripe webhook (checkout.session.completed + checkout.session.expired).
// 3. Connects Stripe to Merchant (secret key + webhook signing secret).
// 4. Optionally adds a few demo products.
//
// Non-interactive use: set MERCHANT_ADMIN_KEY / STRIPE_SECRET_KEY / DEMO_PRODUCTS=yes in the environment.
// Needs Node.js 20+. Nothing is stored on disk; copy the keys it prints into your password manager.
import { openSync } from 'node:fs';
import tty from 'node:tty';

const merchantUrl = (process.argv[2] ?? '').replace(/\/+$/, '');
if (!/^https:\/\/\S+$/.test(merchantUrl)) {
  console.error('Usage: node setup.mjs https://your-merchant-worker.workers.dev');
  process.exit(1);
}

/* ------------------------------ prompts ------------------------------ */

const terminal = (() => {
  try { return new tty.ReadStream(openSync('/dev/tty', 'r')); } catch { return null; }
})();

const ask = (question, { secret = false } = {}) => new Promise((resolve, reject) => {
  if (!terminal) { reject(new Error(`No terminal for "${question}". Set the matching environment variable.`)); return; }
  process.stdout.write(question);
  let answer = '';
  terminal.setRawMode(true);
  terminal.resume();
  const onData = (chunk) => {
    for (const char of chunk.toString('utf8')) {
      if (char === '\r' || char === '\n') {
        terminal.setRawMode(false); terminal.pause(); terminal.off('data', onData);
        process.stdout.write('\n');
        resolve(answer.trim());
        return;
      }
      if (char === '\u0003') { process.stdout.write('\n'); process.exit(130); }
      if (char === '\u007f') { if (answer) { answer = answer.slice(0, -1); if (!secret) process.stdout.write('\b \b'); } continue; }
      answer += char;
      process.stdout.write(secret ? '•' : char);
    }
  };
  terminal.on('data', onData);
});

/* ------------------------------ helpers ------------------------------ */

const sha256 = async (value) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))]
  .map((b) => b.toString(16).padStart(2, '0')).join('');
const randomKey = (prefix) => `${prefix}_${[...crypto.getRandomValues(new Uint8Array(24))].map((b) => b.toString(16).padStart(2, '0')).join('')}`;

const request = async (url, { method = 'GET', headers = {}, body, form } = {}) => {
  const res = await fetch(url, {
    method,
    headers: { ...headers, ...(body ? { 'content-type': 'application/json' } : {}), ...(form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
    body: body ? JSON.stringify(body) : form ? new URLSearchParams(form) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
};

const step = (text) => console.log(`\n→ ${text}`);
const fail = (text) => { console.error(`\n✗ ${text}`); process.exit(1); };

/* ------------------------------ 1. Merchant keys ------------------------------ */

step(`Checking ${merchantUrl}`);
// A just-deployed Worker can take a few seconds to answer on its workers.dev URL.
let root = null;
for (let attempt = 0; attempt < 10; attempt++) {
  root = await request(merchantUrl).catch(() => null);
  if (root?.data?.name === 'merchant') break;
  await new Promise((r) => setTimeout(r, 3000));
}
if (root?.data?.name !== 'merchant') fail('That URL does not answer like a Merchant Worker. Check the URL printed after deploying.');

step('Creating API keys');
const publicKey = randomKey('pk');
let adminKey = randomKey('sk');
const init = await request(`${merchantUrl}/v1/setup/init`, {
  method: 'POST',
  body: { keys: [
    { id: crypto.randomUUID(), key_hash: await sha256(publicKey), key_prefix: 'pk_', role: 'public' },
    { id: crypto.randomUUID(), key_hash: await sha256(adminKey), key_prefix: 'sk_', role: 'admin' },
  ] },
});
const createdKeys = init.ok;
if (createdKeys) {
  console.log('  Keys created.');
} else if (init.status === 409) {
  console.log('  This store already has keys. Continue with your existing admin key.');
  adminKey = process.env.MERCHANT_ADMIN_KEY || await ask('  Merchant admin key (sk_…): ', { secret: true });
} else {
  fail(`Could not create keys: ${init.status} ${JSON.stringify(init.data)}`);
}
const admin = { Authorization: `Bearer ${adminKey}` };
if (!(await request(`${merchantUrl}/v1/orders?limit=1`, { headers: admin })).ok) fail('Merchant rejected the admin key.');

/* ------------------------------ 2. Stripe ------------------------------ */

step('Connecting Stripe');
const stripeKey = process.env.STRIPE_SECRET_KEY || await ask('  Stripe secret key (sk_test_… or sk_live_…): ', { secret: true });
if (!/^(sk|rk)_(test|live)_\w+$/.test(stripeKey)) fail('That does not look like a Stripe secret key.');
const stripe = { Authorization: `Bearer ${stripeKey}` };
const account = await request('https://api.stripe.com/v1/account', { headers: stripe });
if (!account.ok) fail(`Stripe rejected the key: ${account.data?.error?.message ?? account.status}`);
console.log(`  Stripe account: ${account.data.settings?.dashboard?.display_name ?? account.data.id} (${stripeKey.includes('_test_') ? 'test mode' : 'LIVE mode'})`);

const webhookUrl = `${merchantUrl}/v1/webhooks/stripe`;
const endpoints = await request('https://api.stripe.com/v1/webhook_endpoints?limit=100', { headers: stripe });
const existing = endpoints.data?.data?.find((e) => e.url === webhookUrl);
let webhookSecret = null;
if (existing) {
  // Stripe only reveals a signing secret when the endpoint is created. Recreate it so Merchant gets a secret.
  await request(`https://api.stripe.com/v1/webhook_endpoints/${existing.id}`, { method: 'DELETE', headers: stripe });
  console.log('  Replacing the existing Stripe webhook for this Merchant.');
}
const created = await request('https://api.stripe.com/v1/webhook_endpoints', {
  method: 'POST',
  headers: stripe,
  form: {
    url: webhookUrl,
    'enabled_events[0]': 'checkout.session.completed',
    'enabled_events[1]': 'checkout.session.expired',
    description: 'Webstudio × Merchant shop',
  },
});
if (!created.ok) fail(`Could not create the Stripe webhook: ${created.data?.error?.message ?? created.status}`);
webhookSecret = created.data.secret;
console.log('  Stripe webhook created.');

const connected = await request(`${merchantUrl}/v1/setup/stripe`, {
  method: 'POST',
  headers: admin,
  body: { stripe_secret_key: stripeKey, stripe_webhook_secret: webhookSecret },
});
if (!connected.ok) fail(`Merchant could not save the Stripe keys: ${JSON.stringify(connected.data)}`);
console.log('  Stripe connected to Merchant.');

/* ------------------------------ 3. Demo products ------------------------------ */

const demo = process.env.DEMO_PRODUCTS ?? await ask('\n→ Add 4 demo products to try the shop? (y/N) ');
if (/^y(es)?$/i.test(demo)) {
  const products = [
    ['Everyday Mug', 'Wheel-thrown stoneware mug with a satin glaze. Holds 12 oz and is dishwasher safe.', [['DEMO-MUG-SAND', 'Sand', 2800], ['DEMO-MUG-SLATE', 'Slate', 2800]]],
    ['Linen Napkins', 'Stonewashed European linen, set of four, 18 × 18 in.', [['DEMO-NAP-OAT', 'Oat', 3600], ['DEMO-NAP-SAGE', 'Sage', 3600]]],
    ['Beeswax Candle', 'Hand-poured pure beeswax pillar. Burns clean for about 40 hours.', [['DEMO-CANDLE-S', 'Small', 1800], ['DEMO-CANDLE-L', 'Large', 3200]]],
    ['Olive Wood Board', 'Cut from a single piece of olive wood. For bread, cheese, or as a centerpiece.', [['DEMO-BOARD', 'One size', 6400]]],
  ];
  for (const [title, description, variants] of products) {
    const product = await request(`${merchantUrl}/v1/products`, { method: 'POST', headers: admin, body: { title, description } });
    if (!product.ok) { console.log(`  Skipped ${title}: ${JSON.stringify(product.data)}`); continue; }
    for (const [sku, variantTitle, price_cents] of variants) {
      await request(`${merchantUrl}/v1/products/${product.data.id}/variants`, { method: 'POST', headers: admin, body: { sku, title: variantTitle, price_cents } });
      await request(`${merchantUrl}/v1/inventory/${sku}/adjust`, { method: 'POST', headers: admin, body: { delta: 25, reason: 'restock' } });
    }
    await request(`${merchantUrl}/v1/products/${product.data.id}`, { method: 'PATCH', headers: admin, body: { status: 'active' } });
    console.log(`  Added ${title}`);
  }
}

/* ------------------------------ Summary ------------------------------ */

console.log(`
✓ Merchant is ready.
${createdKeys ? `
  Save both keys in your password manager now. They are shown only once.

    Public key  ${publicKey}
    Admin key   ${adminKey}
` : ''}
Next:
  1. Webstudio: open the Global Root variable "shop" and set
       apiUrl                ${merchantUrl}
       publicKey             ${createdKeys ? publicKey : 'your pk_… key'}
       stripePublishableKey  pk_${stripeKey.includes('_test_') ? 'test' : 'live'}_… from Stripe → Developers → API keys
  2. Optional customer accounts and order emails: deploy the account Worker and paste the
     admin key when the deploy button asks for MERCHANT_ADMIN_KEY.
  3. Optional admin dashboard: deploy Merchant admin and sign in with the URL above and the admin key.
`);
process.exit(0);
