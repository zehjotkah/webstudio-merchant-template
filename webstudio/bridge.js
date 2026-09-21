/* Shop bridge for the Webstudio × Merchant template.
 *
 * Everything visible is designed in Webstudio; this script only adds behaviour that a
 * server-rendered page can't: the cart (kept in localStorage until checkout, because Merchant
 * carts need an email up front), the checkout hand-off to Stripe, and customer sign-in.
 *
 * It lives inside the Webstudio project, in the "Shop Bridge" HTML Embed of the Header slot, so
 * copying the project copies it. This file is the source; `node webstudio/sync-bridge.mjs`
 * writes it into the embed.
 *
 * It finds its hooks through data attributes, so designers can restyle or move any element:
 *   [data-shop-api|key|stripe-key|account]  config, set on the Header from the `shop` variable
 *   [data-cart-open] [data-cart-close] [data-cart-drawer] [data-cart-count]
 *   [data-cart-lines] + one [data-cart-line-template] with [data-field=…] children
 *   [data-cart-empty] [data-cart-summary] [data-cart-subtotal]
 *   [data-add-to-cart] form, [data-product-price] [data-product-image] [data-gallery-sku] [data-cart-message]
 *   [data-checkout-form] [data-checkout-error] [data-checkout-submit]
 *   [data-checkout-fields] [data-checkout-address] [data-checkout-actions] [data-checkout-payment] [data-checkout-mount]
 *   [data-checkout-cancel] [data-checkout-address-summary], inputs named email, name, line1, city, …
 *   [data-order-confirmation] [data-order-field=…] [data-order-pending]
 *   [data-account-signed-out|in] [data-signin-form] [data-signin-status] [data-signout]
 *   [data-orders-list] [data-order-template] [data-order-items] [data-order-item-template]
 *   [data-orders-empty] [data-verify-status]
 */
(() => {
  // Webstudio re-runs embed scripts on client-side navigation; one instance is enough.
  if (window.__shopBridge) return;
  window.__shopBridge = true;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const CART_KEY = 'shop-cart';
  const SESSION_KEY = 'shop-session';
  const EMAIL_KEY = 'shop-email';

  const config = () => {
    const el = $('[data-shop-api]');
    return {
      api: el?.dataset.shopApi ?? '',
      key: el?.dataset.shopKey ?? '',
      account: el?.dataset.shopAccount ?? '',
      stripeKey: el?.dataset.shopStripeKey ?? '',
    };
  };

  const store = {
    get(key, fallback) {
      try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
    },
    set(key, value) {
      try { value == null ? localStorage.removeItem(key) : localStorage.setItem(key, JSON.stringify(value)); } catch {}
    },
  };

  // Webstudio serves optimized remote images from /cgi/image/<url>?width=…; build the same URLs.
  const encodeImage = (url) => encodeURIComponent(url).replace(/%2F/g, '/');
  const optimized = (url, width) => `/cgi/image/${encodeImage(url)}?width=${width}&quality=80&format=auto`;

  const money = (cents) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((cents ?? 0) / 100);

  // Only write when the value changes; the MutationObserver below would otherwise loop forever.
  const setText = (el, text) => { if (el && el.textContent !== text) el.textContent = text; };
  const setHidden = (el, hidden) => { if (el && el.hidden !== hidden) el.hidden = hidden; };

  // Webstudio's client router also reacts to form submits and would navigate with the form data
  // as a query string. Handle our forms in the capture phase and stop the event there.
  const onSubmit = (selector, handler) =>
    document.addEventListener('submit', (event) => {
      const form = event.target.closest(selector);
      if (!form) return;
      event.preventDefault();
      event.stopPropagation();
      handler(event, form);
    }, true);

  /* ------------------------------- Cart ------------------------------- */

  const readCart = () => store.get(CART_KEY, { lines: [] });
  const writeCart = (cart) => { store.set(CART_KEY, cart); renderCart(); };
  const count = (cart) => cart.lines.reduce((n, l) => n + l.qty, 0);
  const subtotal = (cart) => cart.lines.reduce((n, l) => n + l.qty * l.priceCents, 0);

  const setQty = (sku, qty) => {
    const cart = readCart();
    cart.lines = cart.lines
      .map((l) => (l.sku === sku ? { ...l, qty: Math.min(99, qty) } : l))
      .filter((l) => l.qty > 0);
    writeCart(cart);
  };

  const addLine = (line) => {
    const cart = readCart();
    const existing = cart.lines.find((l) => l.sku === line.sku);
    if (existing) existing.qty = Math.min(99, existing.qty + line.qty);
    else cart.lines.push(line);
    writeCart(cart);
  };

  const fillLine = (node, line) => {
    node.dataset.cartLine = line.sku;
    const field = (name) => node.querySelector(`[data-field="${name}"]`);
    const img = field('image');
    if (img) {
      if (line.image) {
        // Small optimized thumbnail; fall back to the original if the image service isn't available (Builder canvas).
        img.onerror = () => { img.onerror = null; img.src = line.image; };
        img.src = optimized(line.image, 160);
      } else img.removeAttribute('src');
      setHidden(img, !line.image);
    }
    const title = field('title');
    setText(title, line.title);
    if (title?.tagName === 'A') title.href = `/product/${line.productId}`;
    setText(field('variant'), line.variant ?? '');
    setHidden(field('variant'), !line.variant || line.variant === line.title);
    setText(field('qty'), String(line.qty));
    setText(field('line-total'), money(line.qty * line.priceCents));
    for (const button of node.querySelectorAll('[data-qty-inc],[data-qty-dec],[data-remove]')) {
      button.dataset.sku = line.sku;
      const label = button.hasAttribute('data-remove') ? 'Remove' : button.hasAttribute('data-qty-inc') ? 'Increase quantity of' : 'Decrease quantity of';
      button.setAttribute('aria-label', `${label} ${line.title}${line.variant ? `, ${line.variant}` : ''}`);
    }
  };

  const renderLines = (list, cart, template) => {
    const rendered = $$(':scope > [data-cart-line]', list);
    const signature = cart.lines.map((l) => `${l.sku}:${l.qty}:${l.priceCents}`).join('|');
    if (list.dataset.cartSignature === signature && rendered.length === cart.lines.length) return;
    list.dataset.cartSignature = signature;
    rendered.forEach((node) => node.remove());
    for (const line of cart.lines) {
      const node = template.cloneNode(true);
      node.removeAttribute('data-cart-line-template');
      node.hidden = false;
      fillLine(node, line);
      list.append(node);
    }
  };

  const renderCart = () => {
    const cart = readCart();
    const n = count(cart);
    for (const el of $$('[data-cart-count]')) { setText(el, String(n)); setHidden(el, n === 0); }
    const label = n === 0 ? 'Open cart' : `Open cart, ${n} ${n === 1 ? 'item' : 'items'}`;
    for (const el of $$('[data-cart-open]')) if (el.getAttribute('aria-label') !== label) el.setAttribute('aria-label', label);
    for (const el of $$('[data-cart-empty]')) setHidden(el, n > 0);
    for (const el of $$('[data-cart-summary]')) {
      // Checkout fields also stay hidden while the payment box is shown.
      setHidden(el, n === 0 || (el.hasAttribute('data-checkout-fields') && !!el.closest('[data-paying]')));
    }
    for (const el of $$('[data-cart-subtotal]')) setText(el, money(subtotal(cart)));
    const template = $('[data-cart-line-template]');
    if (template) for (const list of $$('[data-cart-lines]')) { setHidden(list, n === 0); renderLines(list, cart, template); }
  };

  /* ------------------------------ Drawer ------------------------------ */

  const drawer = () => $('[data-cart-drawer]');
  const openDrawer = () => {
    const dialog = drawer();
    if (!dialog || dialog.open) return;
    renderCart();
    dialog.showModal();
  };
  const closeDrawer = () => drawer()?.open && drawer().close();

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (target.closest('[data-cart-open]')) { openDrawer(); return; }
    if (target.closest('[data-cart-close]')) { closeDrawer(); return; }
    // A click on the dialog element itself (not its content) is a click on the backdrop.
    if (target === drawer()) { closeDrawer(); return; }
    // Following a link out of the drawer (product, checkout) should close it.
    if (target.closest('[data-cart-drawer] a')) closeDrawer();

    const control = target.closest('[data-qty-inc],[data-qty-dec],[data-remove]');
    if (control?.dataset.sku) {
      const line = readCart().lines.find((l) => l.sku === control.dataset.sku);
      if (!line) return;
      if (control.hasAttribute('data-remove')) setQty(line.sku, 0);
      else setQty(line.sku, line.qty + (control.hasAttribute('data-qty-inc') ? 1 : -1));
    }
  });

  /* --------------------------- Product page --------------------------- */

  const chosenVariant = (form) =>
    form.querySelector('input[name="sku"]:checked') ?? form.querySelector('input[type="hidden"][name="sku"]');

  const initProductForm = () => {
    const form = $('[data-add-to-cart]');
    if (!form || form.dataset.ready) return;
    form.dataset.ready = 'true';
    const radios = $$('input[type="radio"][name="sku"]', form);
    if (radios.length && !radios.some((r) => r.checked)) radios[0].checked = true;
    const qty = form.querySelector('input[name="qty"]');
    if (qty && !qty.value) qty.value = '1';
    showVariant(form);
  };

  // The gallery shows one photo per variant: picking a variant (radio or thumbnail) swaps the
  // main image and price, so photo, price and selection always match.
  const showVariant = (form) => {
    const input = chosenVariant(form);
    if (!input) return;
    setText($('[data-product-price]'), input.dataset.price ?? '');
    const image = $('[data-product-image]');
    if (image && input.dataset.image) {
      // Keep Webstudio's optimized srcset: swap the encoded source URL inside every candidate.
      const current = image.getAttribute('src') ?? '';
      const match = current.match(/\/cgi\/image\/([^?]+)\?/);
      const next = encodeImage(input.dataset.image);
      if (match && match[1] !== next) {
        const swap = (value) => value.split(match[1]).join(next);
        if (image.srcset) image.srcset = swap(image.getAttribute('srcset'));
        image.src = swap(current);
      } else if (!match && current !== input.dataset.image) {
        image.src = input.dataset.image;
      }
    }
    for (const thumb of $$('[data-gallery-sku]')) {
      const pressed = String(thumb.dataset.gallerySku === input.value);
      if (thumb.getAttribute('aria-pressed') !== pressed) thumb.setAttribute('aria-pressed', pressed);
    }
  };

  document.addEventListener('click', (event) => {
    const thumb = event.target.closest('[data-gallery-sku]');
    const form = $('[data-add-to-cart]');
    if (!thumb || !form) return;
    const radio = $$('input[type="radio"][name="sku"]', form).find((r) => r.value === thumb.dataset.gallerySku);
    if (radio) radio.checked = true;
    showVariant(form);
  });

  document.addEventListener('change', (event) => {
    const form = event.target.closest('[data-add-to-cart]');
    if (form && event.target.name === 'sku') showVariant(form);
  });

  onSubmit('[data-add-to-cart]', (event, form) => {
    const input = chosenVariant(form);
    const message = form.querySelector('[data-cart-message]');
    if (!input) { setText(message, 'Please choose an option.'); return; }
    const qty = Math.max(1, Math.min(99, parseInt(form.querySelector('input[name="qty"]')?.value, 10) || 1));
    addLine({
      sku: input.value,
      qty,
      productId: form.dataset.productId,
      title: form.dataset.productTitle,
      variant: input.dataset.variant,
      priceCents: Number(input.dataset.priceCents) || 0,
      image: input.dataset.image || '',
    });
    setText(message, `Added to your cart.`);
    openDrawer();
  });

  /* ----------------------------- Checkout ----------------------------- */

  const merchant = async (path, body) => {
    const { api, key } = config();
    // A fresh copy of the template has an empty `shop` variable until it is connected.
    if (!api || !key) throw Object.assign(new Error('not configured'), { code: 'not_configured' });
    const res = await fetch(api + path, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw Object.assign(new Error(data.error?.message ?? res.statusText), { code: data.error?.code, details: data.error?.details });
    return data;
  };

  const checkoutMessage = (error, cart) => {
    if (error.code === 'insufficient_inventory') {
      const line = cart.lines.find((l) => l.sku === error.details?.sku);
      return `Sorry, we don't have enough ${line ? line.title : 'of one item'} in stock. Please lower the quantity.`;
    }
    if (error.code === 'not_found') return 'One of the items in your cart is no longer available. Please remove it and try again.';
    if (error.code === 'discount') return "That discount code isn't valid for this order.";
    if (error.code === 'rate_limited') return 'Too many attempts. Please wait a minute and try again.';
    if (error.code === 'not_configured') return "This shop isn't connected to Merchant yet. Fill in the shop variable as described on /docs.";
    return "We couldn't start the payment. Please try again in a moment.";
  };

  /* Stripe Embedded Checkout: the payment form renders inside [data-checkout-mount] on our own
   * page. Without a Stripe publishable key in the `shop` variable, or if Stripe.js can't load,
   * checkout falls back to Stripe's hosted page. */
  let stripeLoading = null;
  const loadStripe = () => {
    const { stripeKey } = config();
    if (!stripeKey || !$('[data-checkout-mount]')) return Promise.resolve(null);
    stripeLoading ??= new Promise((resolve) => {
      if (window.Stripe) { resolve(window.Stripe); return; }
      const script = Object.assign(document.createElement('script'), { src: 'https://js.stripe.com/v3/', async: true });
      script.onload = () => resolve(window.Stripe ?? null);
      script.onerror = () => resolve(null);
      document.head.append(script);
      setTimeout(() => resolve(window.Stripe ?? null), 8000);
    }).then((Stripe) => (Stripe ? Stripe(stripeKey) : null));
    return stripeLoading;
  };

  const ADDRESS_KEY = 'shop-address';
  const ADDRESS_FIELDS = ['name', 'phone', 'line1', 'line2', 'city', 'state', 'postal_code', 'country'];

  let embeddedCheckout = null;

  // While paying, the customer details collapse into a one-line summary, cart editing is locked
  // (the Stripe session has fixed amounts), and only Stripe's payment box is shown.
  const showPayment = (form, visible) => {
    setHidden($('[data-checkout-fields]', form), visible);
    setHidden($('[data-checkout-actions]', form), visible);
    setHidden($('[data-checkout-payment]', form), !visible);
    for (const el of $$('[data-qty-inc],[data-qty-dec],[data-remove]', form)) setHidden(el, visible);
    if (visible) form.dataset.paying = 'true'; else delete form.dataset.paying;
  };

  const mountPayment = async (form, stripe, clientSecret) => {
    embeddedCheckout?.destroy();
    embeddedCheckout = await stripe.initEmbeddedCheckout({ fetchClientSecret: async () => clientSecret });
    showPayment(form, true);
    embeddedCheckout.mount($('[data-checkout-mount]', form));
    $('[data-checkout-payment]', form)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // "Edit details" drops the payment session; the next attempt creates a fresh Merchant cart.
  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-checkout-cancel]')) return;
    const form = $('[data-checkout-form]');
    embeddedCheckout?.destroy();
    embeddedCheckout = null;
    if (form) showPayment(form, false);
  });

  const initCheckoutForm = () => {
    const form = $('[data-checkout-form]');
    if (!form || form.dataset.ready) return;
    form.dataset.ready = 'true';
    // Returning customers: prefill what they entered last time (and the signed-in email).
    const saved = store.get(ADDRESS_KEY, {});
    for (const name of ADDRESS_FIELDS) {
      const input = form.elements[name];
      if (input && !input.value && saved[name]) input.value = saved[name];
    }
    const email = form.elements.email;
    if (email && !email.value) email.value = store.get(SESSION_KEY, null)?.email ?? store.get(EMAIL_KEY, '') ?? '';
    // Hosted mode (no Stripe publishable key): Stripe's own page collects the address, so our
    // address fields are hidden and disabled (disabled fields skip validation). This mode works
    // with unmodified Merchant.
    const hosted = !config().stripeKey;
    for (const block of $$('[data-checkout-address]', form)) {
      setHidden(block, hosted);
      for (const input of block.querySelectorAll('input, select')) input.disabled = hosted;
    }
    loadStripe(); // warm up Stripe.js while the customer fills in the form
  };

  onSubmit('[data-checkout-form]', async (event, form) => {
    if (form.dataset.paying) return;
    const errorBox = form.querySelector('[data-checkout-error]');
    const showError = (text) => { setText(errorBox, text); setHidden(errorBox, !text); };
    const cart = readCart();
    if (!cart.lines.length) { showError('Your cart is empty.'); return; }
    if (!form.reportValidity()) return;

    const email = form.elements.email.value.trim().toLowerCase();
    const discount = form.elements.discount?.value.trim().toUpperCase();
    const address = Object.fromEntries(ADDRESS_FIELDS
      .map((name) => [name, form.elements[name]?.value.trim() ?? ''])
      .filter(([, value]) => value));
    const button = form.querySelector('[data-checkout-submit]') ?? form.querySelector('[type="submit"]');
    const label = button?.textContent;
    if (button) { button.disabled = true; button.textContent = 'Preparing secure payment…'; }
    showError('');
    store.set(EMAIL_KEY, email);
    store.set(ADDRESS_KEY, address);

    try {
      const created = await merchant('/v1/carts', { customer_email: email });
      // Merchant replaces the item list and returns the authoritative prices.
      const priced = await merchant(`/v1/carts/${created.id}/items`, { items: cart.lines.map(({ sku, qty }) => ({ sku, qty })) });
      const prices = new Map(priced.items.map((i) => [i.sku, i.unit_price_cents]));
      cart.lines.forEach((l) => { l.priceCents = prices.get(l.sku) ?? l.priceCents; });
      store.set(CART_KEY, cart);
      if (discount) {
        await merchant(`/v1/carts/${created.id}/apply-discount`, { code: discount })
          .catch(() => { throw Object.assign(new Error('discount'), { code: 'discount' }); });
      }
      const successUrl = `${location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const stripe = await loadStripe();
      // Embedded: the address comes from our form and Stripe only takes the payment (needs merchant.patch).
      // Hosted: Stripe's page collects the address for the countries offered in our country select.
      const countries = $$('select[name="country"] option', form).map((o) => o.value).filter(Boolean);
      const session = await merchant(`/v1/carts/${created.id}/checkout`, stripe
        ? { ui_mode: 'embedded', return_url: successUrl, shipping_address: address }
        : { success_url: successUrl, cancel_url: `${location.origin}/cart`, collect_shipping: true, shipping_countries: countries.length ? countries : ['US'] });
      if (stripe && session.client_secret) {
        setText($('[data-checkout-address-summary]', form),
          [address.name, address.line1, address.line2, `${address.city}${address.state ? `, ${address.state}` : ''} ${address.postal_code}`, address.country, email]
            .filter(Boolean).join(' · '));
        await mountPayment(form, stripe, session.client_secret);
        return;
      }
      location.assign(session.checkout_url);
    } catch (error) {
      console.warn('[shop] checkout', error);
      showError(checkoutMessage(error, cart));
      renderCart();
    } finally {
      if (button) { button.disabled = false; button.textContent = label; }
    }
  });

  /* --------------------------- Confirmation --------------------------- */

  const initConfirmation = async () => {
    const box = $('[data-order-confirmation]');
    if (!box || box.dataset.ready) return;
    box.dataset.ready = 'true';
    const sessionId = new URLSearchParams(location.search).get('session_id');
    if (!sessionId) return;
    // Payment succeeded, so the cart has become an order.
    writeCart({ lines: [] });
    const { account } = config();
    // Merchant records the order from Stripe's webhook, which can lag the redirect by a few seconds.
    // Without the optional account Worker there is no order lookup; the thank-you text stands alone.
    for (let attempt = 0; account && attempt < 6; attempt++) {
      try {
        const res = await fetch(`${account}/checkout/order?session_id=${encodeURIComponent(sessionId)}`);
        const data = await res.json();
        if (data.ok && !data.pending) {
          const field = (name) => box.querySelector(`[data-order-field="${name}"]`);
          setText(field('number'), data.order.number);
          setText(field('email'), data.order.email);
          setText(field('total'), money(data.order.total.cents));
          setHidden(box, false);
          setHidden($('[data-order-pending]'), true);
          return;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 1500));
    }
    if (account) setHidden($('[data-order-pending]'), false);
  };

  /* ------------------------------ Account ------------------------------ */

  const readSession = () => {
    const s = store.get(SESSION_KEY, null);
    return s && new Date(s.expiresAt) > new Date() ? s : null;
  };

  const accountCall = async (path, { method = 'GET', body, session } = {}) => {
    // Customer accounts are optional: without an account Worker, answer like an unconfigured one.
    if (!config().account) return { status: 503, data: { ok: false, error: 'email_not_configured' } };
    const res = await fetch(config().account + path, {
      method,
      headers: {
        accept: 'application/json',
        ...(body ? { 'content-type': 'application/json' } : {}),
        ...(session ? { authorization: `Bearer ${session}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, data: await res.json().catch(() => ({})) };
  };

  const STATUS_LABELS = {
    pending: 'Pending', paid: 'Paid', processing: 'Processing', shipped: 'Shipped',
    delivered: 'Delivered', refunded: 'Refunded', canceled: 'Canceled',
  };

  const renderOrders = (orders) => {
    const list = $('[data-orders-list]');
    const template = $('[data-order-template]');
    if (!list || !template) return;
    $$(':scope > [data-order]', list).forEach((n) => n.remove());
    for (const order of orders) {
      const node = template.cloneNode(true);
      node.removeAttribute('data-order-template');
      node.dataset.order = order.number;
      node.hidden = false;
      const field = (name) => node.querySelector(`[data-field="${name}"]`);
      setText(field('number'), order.number);
      setText(field('status'), STATUS_LABELS[order.status] ?? order.status);
      setText(field('total'), money(order.total.cents));
      setText(field('date'), `Placed ${new Date(order.placedAt).toLocaleDateString('en-US', { dateStyle: 'long' })}`);
      setText(field('items'), order.items.map((i) => `${i.qty} × ${i.title}`).join(', '));

      // Expandable details: one row per item (cloned from its template), totals and address.
      const itemList = node.querySelector('[data-order-items]');
      const itemTemplate = node.querySelector('[data-order-item-template]');
      if (itemList && itemTemplate) {
        for (const item of order.items) {
          const row = itemTemplate.cloneNode(true);
          row.removeAttribute('data-order-item-template');
          row.hidden = false;
          setText(row.querySelector('[data-field="item"]'), `${item.qty} × ${item.title}`);
          setText(row.querySelector('[data-field="line"]'), money(item.lineCents));
          itemList.append(row);
        }
      }
      const amounts = order.amounts ?? {};
      setText(field('subtotal'), money(amounts.subtotal));
      setText(field('discount'), `−${money(amounts.discount)}`);
      setHidden(node.querySelector('[data-row="discount"]'), !amounts.discount);
      setText(field('shipping'), amounts.shipping ? money(amounts.shipping) : 'Free');
      setText(field('tax'), money(amounts.tax));
      setHidden(node.querySelector('[data-row="tax"]'), !amounts.tax);
      setText(field('grand-total'), money(amounts.total ?? order.total.cents));
      setText(field('address'), (order.shippingAddress ?? []).join('\n') || '—');
      const tracking = field('tracking');
      if (tracking) {
        if (order.trackingUrl) tracking.href = order.trackingUrl;
        setHidden(tracking, !order.trackingUrl);
      }
      list.append(node);
    }
    setHidden($('[data-orders-empty]'), orders.length > 0);
  };

  const showSignedIn = (signedIn) => {
    setHidden($('[data-account-signed-out]'), signedIn);
    setHidden($('[data-account-signed-in]'), !signedIn);
  };

  const initAccount = async () => {
    const page = $('[data-account-signed-out]');
    if (!page || page.dataset.ready) return;
    page.dataset.ready = 'true';
    const session = readSession();
    if (!session) { showSignedIn(false); return; }
    showSignedIn(true);
    setText($('[data-account-email]'), session.email);
    const { status, data } = await accountCall('/me/orders', { session: session.session });
    if (status === 401) { store.set(SESSION_KEY, null); showSignedIn(false); return; }
    renderOrders(data.orders ?? []);
  };

  const SIGNIN_MESSAGES = {
    invalid_email: 'Please enter a valid email address.',
    rate_limited: 'Too many sign-in requests. Please try again in 15 minutes.',
    email_not_configured: "Sign-in by email isn't set up for this shop yet.",
  };

  onSubmit('[data-signin-form]', async (event, form) => {
    if (!form.reportValidity()) return;
    const status = form.querySelector('[data-signin-status]');
    const button = form.querySelector('[type="submit"]');
    const email = form.elements.email.value.trim();
    if (button) button.disabled = true;
    setText(status, 'Sending…');
    try {
      const { data } = await accountCall('/auth/request', { method: 'POST', body: { email } });
      if (data.ok && data.devLink) {
        // Only when the account Worker runs with DEV_RETURN_LINK=true (never in production).
        status.textContent = 'Development mode: ';
        const link = Object.assign(document.createElement('a'), { href: data.devLink, textContent: 'open your sign-in link' });
        status.append(link);
      } else if (data.ok) {
        setText(status, `Check your inbox. We sent a sign-in link to ${email}. It expires in 15 minutes.`);
      } else {
        setText(status, SIGNIN_MESSAGES[data.error] ?? "We couldn't send the link. Please try again.");
      }
    } catch {
      setText(status, "We couldn't reach the shop. Please check your connection and try again.");
    } finally {
      if (button) button.disabled = false;
    }
  });

  document.addEventListener('click', async (event) => {
    if (!event.target.closest('[data-signout]')) return;
    const session = readSession();
    store.set(SESSION_KEY, null);
    showSignedIn(false);
    if (session) await accountCall('/auth/logout', { method: 'POST', session: session.session }).catch(() => {});
  });

  const initVerify = async () => {
    const status = $('[data-verify-status]');
    if (!status || status.dataset.ready) return;
    status.dataset.ready = 'true';
    const token = new URLSearchParams(location.hash.slice(1)).get('token');
    // Drop the token from the address bar and history straight away.
    history.replaceState(null, '', location.pathname);
    const fail = (text) => { setText(status, text); setHidden($('[data-verify-retry]'), false); };
    if (!token) { fail('This sign-in link is incomplete. Please request a new one.'); return; }
    const { data } = await accountCall('/auth/verify', { method: 'POST', body: { token } }).catch(() => ({ data: {} }));
    if (!data.ok) { fail('This sign-in link has expired or was already used. Please request a new one.'); return; }
    store.set(SESSION_KEY, { session: data.session, email: data.email, expiresAt: data.expiresAt });
    setText(status, 'Signed in. Taking you to your account…');
    location.replace('/account');
  };

  /* ------------------------------- Start ------------------------------- */

  const initPage = () => {
    renderCart();
    initProductForm();
    initCheckoutForm();
    initConfirmation();
    initAccount();
    initVerify();
  };

  // Start after hydration: changing the DOM earlier makes React discard and re-render it.
  // Client-side navigation swaps page content without a reload, so watch for new hooks.
  const start = () => {
    initPage();
    let path = location.pathname;
    new MutationObserver(() => {
      if (path !== location.pathname) { path = location.pathname; closeDrawer(); }
      initPage();
    }).observe(document.body, { childList: true, subtree: true });
    // Keep tabs in sync when the cart changes in another tab.
    window.addEventListener('storage', (event) => { if (event.key === CART_KEY) renderCart(); });
  };
  if (document.readyState === 'complete') setTimeout(start, 0);
  else window.addEventListener('load', () => setTimeout(start, 0), { once: true });
})();
