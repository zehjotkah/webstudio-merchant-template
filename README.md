# Webstudio × Merchant shop template

A small, complete online shop, designed natively in [Webstudio](https://webstudio.is) on the
[Craft](https://docs.webstudio.is/university/craft) design system, with [Merchant](https://github.com/ygwyg/merchant)
(Cloudflare Workers + Stripe) as the commerce backend. Provided by [ELECOS](https://elecos.de).

**Live demo:** https://webstudio-merchant-shop-template.elecos.de · **Full guide:** [/docs](https://webstudio-merchant-shop-template.elecos.de/docs)

- Catalog, product pages with variant gallery, cart drawer
- Checkout form designed in Webstudio, compact Stripe payment box (card, Apple Pay, Google Pay, Link)
- Customer accounts via email magic link with full order history
- Order confirmation to the customer, "new order" email to you
- Craft design system: re-theme the whole shop from two seed colors

## Set up your shop

### 1. Copy the Webstudio project

Open the template in Webstudio and clone it into your workspace: **[Webstudio template](https://p-203cb399-37cc-4cff-9d7f-7bd9b24f1c95.apps.webstudio.is/?authToken=8988cf57-da2e-4cec-9320-bc184049b0d4&mode=preview)**.
It starts unconnected: pages render, the catalog stays empty until step 4.

### 2. Deploy Merchant

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/zehjotkah/webstudio-merchant-template/tree/main/merchant)

Cloudflare creates the Worker, its database and image bucket. The build fetches Merchant from its own
repository and applies [`merchant.patch`](merchant/merchant.patch); this repository contains no copy of Merchant.

### 3. Run the setup script once

```sh
curl -fsSL https://raw.githubusercontent.com/zehjotkah/webstudio-merchant-template/main/setup.mjs \
  | node - https://webstudio-merchant.YOUR-SUBDOMAIN.workers.dev
```

It creates Merchant's API keys, creates the Stripe webhook, connects your Stripe account (use a `sk_test_…` key
to start) and can add demo products. It prints your keys once; save them in your password manager.

### 4. Connect Webstudio

In your Webstudio copy, open the Global Root variable **`shop`** and fill in:

| Field | Value |
| --- | --- |
| `apiUrl` | Your Merchant URL |
| `publicKey` | `pk_…` from the setup script (safe in the browser: it can only read products and create carts) |
| `stripePublishableKey` | `pk_test_…` from Stripe → Developers → API keys (empty = Stripe's hosted checkout page) |
| `accountUrl` | Your account Worker URL from step 5, or empty |

Publish. Test with card `4242 4242 4242 4242`, any future date, any CVC.

### 5. Optional: customer accounts and order emails

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/zehjotkah/webstudio-merchant-template/tree/main/account)

Paste your Merchant admin key (`sk_…`) when asked. Then, in the new repository Cloudflare created for you,
edit `wrangler.jsonc`: set `SITE_ORIGIN`, onboard a sender domain in Cloudflare Email Sending, set `MAIL_FROM`
and `SHOP_INBOX`, and uncomment `send_email`. Open the Worker's URL once: it registers itself for Merchant's
order webhook. Put the URL into `shop.accountUrl`.

### 6. Optional: admin dashboard

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/zehjotkah/webstudio-merchant-template/tree/main/admin)

Merchant's own dashboard for products, stock, images, orders and discounts. Sign in with your Merchant URL and admin key.

## How it works

```
Webstudio page ──Resources (server-side, every request)──▶ Merchant  GET /v1/products   (public key)
      │
      │  Shop Bridge (script inside the Webstudio project)
      ├─ cart (localStorage), checkout ──────────────────▶ Merchant  /v1/carts …       (public key)
      │   (address from a Webstudio form)                      └─▶ Stripe payment box on /cart
      └─ sign-in, order history ──▶ account Worker ──service binding + admin key──▶ Merchant
                                         ▲
                     order emails ◀──────┘◀── Merchant order.created webhook
```

| Rendered by Webstudio on the server | Done by the Shop Bridge in the browser |
| --- | --- |
| All pages, layout, header and footer | Cart contents, count badge, cart drawer |
| Product list and pages (Resources → Merchant) | Add to cart, quantities, variant photo and price |
| Titles, meta, a real 404 for unknown products | Checkout and Stripe's payment box |
| Hidden design templates for cart lines and orders | Order confirmation, sign-in, order history |

Webstudio Resources run once per request on the server: they can't see a visitor's cart or session, can't run a
multi-step checkout, and must never hold secret keys. The Shop Bridge covers exactly that, without drawing any
layout: it fills and clones elements designed in Webstudio, found by `data-*` attributes.

## Repository

| Path | What it is |
| --- | --- |
| `merchant/` | Deploy wrapper: fetches Merchant at a pinned commit, applies `merchant.patch` |
| `admin/` | Deploy wrapper: fetches and builds Merchant's admin dashboard |
| `account/` | Account Worker: magic-link sign-in, order history, order emails |
| `setup.mjs` | One-time Merchant + Stripe setup |
| `webstudio/bridge.js` | Readable source of the Shop Bridge embed; `sync-bridge.mjs` writes it into a project |
| `webstudio/` (rest) | Scripts and JSX fragments used to build the Webstudio project through its CLI |

## `merchant.patch`

Backwards compatible, checked against Merchant `1b42cbb`:

| Change | Why |
| --- | --- |
| Embedded checkout (`ui_mode: "embedded"` + `return_url` → `client_secret`) | Stripe's payment box on your page |
| `shipping_address` on checkout, stored on the order by the webhook | Address form designed in Webstudio |
| `STRIPE_AUTOMATIC_TAX` setting | Checkout works before Stripe Tax is activated |
| Line items named "Product – Variant" | Clear names on Stripe, receipts and orders |
| Stripe keys fall back to the ones saved by `/v1/setup/stripe` | Connecting Stripe once is enough |
| Stock fix: abandoned checkouts release reserved stock; expired carts no longer make `reserved` negative | Upstream can leak reservations and oversell |

## Limits

- Merchant stores one image per variant; the gallery shows the variants' photos. No slugs or categories.
- Stock isn't readable with the public key; low stock surfaces as a message at checkout.
- Replace the placeholder legal pages, the ELECOS credit and imprint link before launching.

## License

MIT. Merchant is MIT licensed by its authors; this repository only contains a patch for it.
