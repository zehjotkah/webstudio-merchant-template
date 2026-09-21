"""Generates webstudio/fragments/docs-main.jsx — the /docs page of the template.

Text uses a tiny markup: `code`, [label](url). Code blocks are lists of lines.
Everything is escaped for Webstudio JSX (braces and angle brackets become entities).
"""
import html
import re

REPO = "https://github.com/zehjotkah/webstudio-merchant-template"
DEPLOY = "https://deploy.workers.cloudflare.com/?url=" + REPO + "/tree/main/"


def esc(text):
    return html.escape(text, quote=False).replace("{", "&#123;").replace("}", "&#125;")


def inline(text):
    out = esc(text)
    out = re.sub(r"`([^`]+)`", r'<code craft="code">\1</code>', out)
    out = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r'<a href="\2" craft="link">\1</a>', out)
    return out


def p(text):
    return f'<p craft="text">{inline(text)}</p>'


def note(text):
    return f'<p craft="surface, text, text-small" ws:style={{css`padding: var(--gap-s);`}}>{inline(text)}</p>'


def code(*lines):
    body = "".join(f'<span ws:style={{css`display: block; min-height: 1.7em;`}}>{esc(line)}</span>' for line in lines)
    return f'<pre craft="code-block"><code>{body}</code></pre>'


def steps(*items):
    lis = "".join(f'<li craft="text">{inline(i)}</li>' for i in items)
    return f'<ol craft="stack, stack-small" ws:style={{css`margin-top: 0; margin-bottom: 0; padding-left: 1.25rem;`}}>{lis}</ol>'


def bullets(*items):
    lis = "".join(f'<li craft="text">{inline(i)}</li>' for i in items)
    return f'<ul craft="stack, stack-small" ws:style={{css`margin-top: 0; margin-bottom: 0; padding-left: 1.25rem;`}}>{lis}</ul>'


def table(head, *rows):
    th = "".join(
        f'<th scope="col" ws:style={{css`text-align: left; padding: var(--size-2) var(--size-3); font-size: var(--font-size-0); font-weight: 600; color: var(--foreground-secondary); border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: var(--border-control);`}}>{esc(h)}</th>'
        for h in head)
    trs = "".join(
        "<tr>" + "".join(
            f'<td ws:style={{css`padding: var(--size-2) var(--size-3); vertical-align: top; font-size: var(--font-size-1); color: var(--foreground-primary); border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: var(--border-default);`}}>{inline(c)}</td>'
            for c in r) + "</tr>"
        for r in rows)
    return (f'<div ws:label="Table" ws:style={{css`overflow-x: auto;`}}><table ws:style={{css`width: 100%; border-collapse: collapse;`}}>'
            f'<thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table></div>')


def deploy(folder, label):
    return f'<p><a href="{DEPLOY}{folder}" target="_blank" rel="noopener" craft="button">{esc(label)}</a></p>'


def h3(text):
    return f'<h3 craft="heading, heading-s" ws:style={{css`margin-top: var(--gap-s);`}}>{esc(text)}</h3>'


SECTIONS = [
    ("overview", "How it works", [
        p("This template is a complete small shop. Everything you see is designed natively in Webstudio on the Craft design system. Commerce runs on [Merchant](https://github.com/ygwyg/merchant), an open-source backend for Cloudflare Workers and Stripe."),
        table(["Part", "Runs on", "Does"],
              ["Webstudio site", "Webstudio", "Pages and design. Loads products server-side through Resources, so the catalog is fast and indexable."],
              ["Merchant", "Your Cloudflare account", "Products, variants, stock, carts, Stripe Checkout, orders, discounts, product images."],
              ["Account Worker (optional)", "Your Cloudflare account", "Customer sign-in by email link, order history, and the order number on the confirmation page."],
              ["Shop Bridge", "Inside the Webstudio project", "A small script in an HTML Embed of the Header slot. It runs the cart, checkout and sign-in in the browser."]),
        h3("A purchase, step by step"),
        steps("The shopper adds products. The cart lives in the browser (`localStorage`) until checkout, because Merchant carts need an email address up front.",
              "On `/cart` they fill in contact details and the shipping address in a form designed in Webstudio. `bridge.js` creates a Merchant cart, and Merchant re-prices every item, checks stock and applies the discount code.",
              "Merchant opens a Stripe Checkout session with that address. Only a compact Stripe payment box appears on the page (card, Apple Pay, Google Pay, Link).",
              "After payment Stripe returns the shopper to `/checkout/success`. Stripe's webhook tells Merchant to create the order and reduce stock.",
              "The shopper can sign in at `/account` with a one-time email link to see their orders and tracking."),
    ]),
    ("rendering", "Server and browser", [
        p("Webstudio renders every page on the server. That covers everything that is the same for all visitors. Anything that belongs to one visitor (their cart, their payment, their account) can only happen in the browser, and that is the job of `bridge.js`."),
        table(["Rendered on the server by Webstudio", "Handled in the browser by bridge.js"],
              ["All pages, layout, text, header and footer", "Cart contents, item count badge and the cart drawer"],
              ["Product list and product pages, fetched from Merchant through Resources with the public key", "Adding to cart, changing quantities, removing items"],
              ["Prices, descriptions and variant options as HTML, so search engines and link previews see them", "Switching the shown price when a variant is picked"],
              ["Page titles, meta descriptions and a real 404 status for unknown products", "Checkout: creating the Merchant cart and mounting Stripe's payment form"],
              ["The designs for a cart line and an order row, as hidden templates", "Order number on the confirmation page, sign-in, sign-out and order history"]),
        h3("Why Webstudio needs a bridge"),
        bullets("Resources run on the server once per page request. They can read public data such as the product catalog, but not a visitor's own state: a cart in `localStorage` or a sign-in session only exists in that visitor's browser.",
                "Checkout is a sequence of calls (create cart, add items, apply discount, start payment) whose results feed the next step and end in Stripe's payment form. That needs code running on the page, and Stripe.js only runs in the browser.",
                "Secret keys must never reach Webstudio. Everything that needs Merchant's admin key (orders, customers) goes through the account Worker, which only returns the signed-in customer's own orders."),
        h3("How the bridge stays out of the design"),
        bullets("The bridge draws no layout. It finds elements you designed by `data-*` attributes and only fills in text, toggles `hidden` and clones the hidden templates. Moving or restyling elements in Webstudio never breaks it.",
                "It is one dependency-free script inside the Shop Bridge HTML Embed of the Header slot, so every page has it and copying the project copies it. Its readable source is `webstudio/bridge.js` in the template repository.",
                "It starts after Webstudio has hydrated the page and watches for client-side navigation, so it works across page changes without a reload.",
                "It handles its forms before Webstudio's router does, which otherwise would turn a submit into a page navigation."),
    ]),
    ("requirements", "What you need", [
        bullets("A Webstudio plan with dynamic data (Resources).",
                "A Cloudflare account. The Workers free plan is enough to start.",
                "A Stripe account. Test mode works for everything below.",
                "Node.js 20+ on your computer, once, for the setup script.",
                "Optional: a domain on Cloudflare DNS for sign-in and order emails (Cloudflare Email Sending)."),
        p(f"Everything outside Webstudio lives in the [template repository]({REPO}): deploy wrappers for Merchant and its admin dashboard, the optional account Worker, the setup script and the Shop Bridge source. Merchant itself is fetched from its own repository during the build; the template ships only a patch, never a fork."),
    ]),
    ("checkout-modes", "Choose your checkout", [
        p("The template supports two checkouts. You pick one by filling in, or leaving empty, `stripePublishableKey` in the `shop` variable."),
        table(["", "Embedded (recommended)", "Hosted"],
              ["What the shopper sees", "Your own Webstudio form for contact and shipping address, then a compact Stripe payment box on the same page", "Email on your page, then a redirect to Stripe's checkout page, which asks for the address and payment"],
              ["Merchant", "Needs `merchant.patch`", "Works with unmodified Merchant; the patch's stock fix is still recommended"],
              ["`stripePublishableKey`", "`pk_test_…` / `pk_live_…`", "Empty. The address fields on `/cart` hide automatically."],
              ["Stripe Tax", "Optional (`STRIPE_AUTOMATIC_TAX`)", "Must be active: unmodified Merchant always enables it"],
              ["Line items on Stripe", "“Beeswax Candle – Large”", "“Large” (variant name only)"]),
        p("Countries offered for shipping come from the options of the Country select on `/cart`, in both modes. Edit them in Webstudio."),
    ]),
    ("merchant", "1. Deploy Merchant", [
        deploy("merchant", "Deploy Merchant to Cloudflare"),
        p("Cloudflare copies the deploy wrapper into your GitHub account, creates the Worker with its database and image bucket, and deploys it. During the build it fetches Merchant at a pinned version and applies `merchant.patch`. Note the URL it shows, for example `https://webstudio-merchant.your-subdomain.workers.dev`."),
        p("Prefer the terminal? Clone the repository and run `npm install && npx wrangler deploy` inside `merchant/`."),
    ]),
    ("stripe", "2. Run the setup script", [
        code("curl -fsSL https://raw.githubusercontent.com/zehjotkah/webstudio-merchant-template/main/setup.mjs \\",
             "  | node - https://webstudio-merchant.your-subdomain.workers.dev"),
        steps("Creates Merchant's API keys and prints them once. Save both in your password manager.",
              "Asks for your Stripe secret key (`sk_test_…` to start; input is hidden), creates the Stripe webhook for paid and expired checkouts, and connects Stripe to Merchant.",
              "Optionally adds four demo products so you can try the shop right away."),
        table(["Key", "Starts with", "Where it goes"],
              ["Public key", "`pk_`", "Webstudio `shop` variable. Safe in the browser: it can only read products and create carts."],
              ["Admin key", "`sk_`", "The account Worker (step 3) and your password manager. Never paste it into Webstudio."]),
        p("Copy your Stripe publishable key (`pk_test_…` or `pk_live_…`) from Stripe → Developers → API keys. It goes into the `shop` variable and enables the payment box on your own page."),
        h3("Taxes"),
        p("`STRIPE_AUTOMATIC_TAX` in `merchant/wrangler.jsonc` controls Stripe Tax. It is `\"false\"` in this template. Set it to `\"true\"` only after Stripe Tax is active on your Stripe account, otherwise every checkout fails."),
    ]),
    ("account", "3. Optional: customer accounts and order emails", [
        deploy("account", "Deploy the account Worker to Cloudflare"),
        p("Paste your Merchant admin key when the deploy asks for `MERCHANT_ADMIN_KEY`. The Worker creates its database tables by itself. Then, in the repository Cloudflare created for you, edit `wrangler.jsonc`; every push redeploys:"),
        table(["Setting", "Value"],
              ["`SHOP_NAME`", "Your shop's name, used in emails."],
              ["`SITE_ORIGIN`", "Your published site, for example `https://shop.example.com`."],
              ["`ALLOWED_ORIGINS`", "Other origins allowed to call the Worker, comma separated: your `*.wstd.io` staging domain and the Builder canvas origin."],
              ["`MAIL_FROM`", "Sender address on a domain onboarded to Cloudflare Email Sending."],
              ["`SHOP_INBOX`", "Your inbox for “new order” emails. Leave empty to skip them."],
              ["`ADMIN_URL`", "Your Merchant admin URL, linked from “new order” emails."],
              ["`send_email`", "Uncomment once `MAIL_FROM`'s domain is onboarded."],
              ["`services`", "Points to your Merchant Worker by name (`webstudio-merchant`). Change it if you renamed Merchant."]),
        h3("Sign-in and order emails"),
        p("In Cloudflare go to Compute → Email Service → Email Sending and onboard your domain or a subdomain. Cloudflare adds the SPF, DKIM and DMARC records. A subdomain keeps your main domain's email untouched."),
        p("Finally, open the account Worker's URL once in your browser. It registers itself for Merchant's order webhook and answers with its status. Put the URL into `shop.accountUrl`."),
        note("Without the account Worker the shop and checkout still work; only sign-in, order history, order emails and the order number on the confirmation page need it."),
    ]),
    ("emails", "Order emails", [
        p("With the account Worker deployed and email set up, every paid order sends two emails through Cloudflare Email Sending:"),
        table(["Email", "To", "Contains"],
              ["Order confirmation", "The customer", "Order number, items, totals, shipping address and a link to their account"],
              ["New order", "`SHOP_INBOX`", "The same details plus the customer's email and a link to your Merchant admin"]),
        bullets("Merchant announces each paid order with its signed `order.created` webhook. The account Worker registered itself for it when you first opened its URL, and keeps the signing secret in its database.",
                "The Worker checks Merchant's signature on every call and sends each order's emails only once, even when Merchant retries.",
                "Customers who sign in at `/account` with the same email see every order with items, prices, totals, shipping address, status and tracking."),
    ]),
    ("webstudio", "4. Connect Webstudio", [
        p("All connection settings live in one place: the `shop` variable on Global Root (Data variables panel). Edit it and publish."),
        table(["Field", "Example", "Used for"],
              ["`name`", "`Hearth`", "Shop name"],
              ["`apiUrl`", "`https://webstudio-merchant….workers.dev`", "Merchant URL for Resources and checkout"],
              ["`publicKey`", "`pk_…` (Merchant)", "Reading products, creating carts"],
              ["`stripePublishableKey`", "`pk_test_…` (Stripe)", "Embedded checkout. Leave empty for the hosted checkout."],
              ["`accountUrl`", "`https://webstudio-merchant-account….workers.dev`", "Sign-in, orders, and loading `bridge.js`"],
              ["`currency`", "`USD`", "Display currency"]),
        p("Leave `accountUrl` empty if you don't deploy the account Worker: the shop and checkout work without it, and only sign-in and the order number on the confirmation page need it."),
        note("A fresh copy of the template starts with an empty `shop` variable. The pages render, the catalog stays empty and checkout says the shop isn't connected yet, until you fill in your own values. The [live demo](https://webstudio-merchant-shop-template.elecos.de) shows the template fully connected."),
    ]),
    ("testing", "5. Test a purchase", [
        p("While Merchant uses Stripe test keys (`sk_test_…`, `pk_test_…`), no real money moves. Add something to the cart, continue to payment and use:"),
        table(["Field", "Enter"],
              ["Card number", "`4242 4242 4242 4242`"],
              ["Expiry date", "Any date in the future, for example `12/34`"],
              ["CVC", "Any three digits, for example `123`"],
              ["Name, address, ZIP", "Anything"]),
        p("To test other outcomes, use `4000 0025 0000 3155` (asks for 3-D Secure confirmation) or `4000 0000 0000 9995` (declined: insufficient funds). Stripe lists more in its [testing documentation](https://docs.stripe.com/testing)."),
        p("After paying you land on `/checkout/success` with your order number. The order appears in Merchant's admin, and signing in at `/account` with the same email shows it in the order history."),
        h3("Going live"),
        steps("Switch Stripe to live mode and run the setup script again with your live secret key (`sk_live_…`). It keeps your Merchant keys and replaces the Stripe connection and webhook.",
              "Put the live publishable key (`pk_live_…`) into the `shop` variable.",
              "Delete the Demo Notice on the cart page (inside the Payment section) and replace the placeholder legal pages.",
              "Publish, then place one real order and refund it through Merchant to confirm the whole flow."),
    ]),
    ("products", "Managing products", [
        p("The easiest way is Merchant's own admin dashboard, deployed as a small static Worker:"),
        deploy("admin", "Deploy the admin dashboard to Cloudflare"),
        p("Open its URL and sign in with your Merchant URL and admin key (`sk_…`). The key stays in that browser only. The dashboard manages products, variants, stock, images, orders, customers and discounts."),
        '<div ws:label="Admin Screenshots" ws:style={css`display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: var(--gap-s); align-items: start;`}><figure ws:style={css`margin: 0; display: flex; flex-direction: column; row-gap: var(--size-2);`}><Image src={new AssetValue("0xAPCafTRF-LcQOKQECFR")} alt="Merchant admin product list" width={1148} height={1055} optimize={true} loading="lazy" sizes="(max-width: 991px) 100vw, 16rem" ws:style={css`display: block; width: 100%; height: auto; border-top-width: 1px; border-right-width: 1px; border-bottom-width: 1px; border-left-width: 1px; border-top-style: solid; border-right-style: solid; border-bottom-style: solid; border-left-style: solid; border-top-color: var(--border-default); border-right-color: var(--border-default); border-bottom-color: var(--border-default); border-left-color: var(--border-default); border-top-left-radius: var(--radius-control); border-top-right-radius: var(--radius-control); border-bottom-left-radius: var(--radius-control); border-bottom-right-radius: var(--radius-control);`} /><figcaption craft="text, text-small">Products: every product with its variants and status.</figcaption></figure><figure ws:style={css`margin: 0; display: flex; flex-direction: column; row-gap: var(--size-2);`}><Image src={new AssetValue("zcDbAzDo0PdhIUz8XN5eP")} alt="Merchant admin product editor with three variants" width={1148} height={1055} optimize={true} loading="lazy" sizes="(max-width: 991px) 100vw, 16rem" ws:style={css`display: block; width: 100%; height: auto; border-top-width: 1px; border-right-width: 1px; border-bottom-width: 1px; border-left-width: 1px; border-top-style: solid; border-right-style: solid; border-bottom-style: solid; border-left-style: solid; border-top-color: var(--border-default); border-right-color: var(--border-default); border-bottom-color: var(--border-default); border-left-color: var(--border-default); border-top-left-radius: var(--radius-control); border-top-right-radius: var(--radius-control); border-bottom-left-radius: var(--radius-control); border-bottom-right-radius: var(--radius-control);`} /><figcaption craft="text, text-small">Editing a product: variants with photo, SKU and price.</figcaption></figure><figure ws:style={css`margin: 0; display: flex; flex-direction: column; row-gap: var(--size-2);`}><Image src={new AssetValue("JzH3sOybIFPdxVG7Z3IOZ")} alt="Merchant admin order detail with items, totals and tracking" width={476} height={429} optimize={true} loading="lazy" sizes="(max-width: 991px) 100vw, 16rem" ws:style={css`display: block; width: 100%; height: auto; border-top-width: 1px; border-right-width: 1px; border-bottom-width: 1px; border-left-width: 1px; border-top-style: solid; border-right-style: solid; border-bottom-style: solid; border-left-style: solid; border-top-color: var(--border-default); border-right-color: var(--border-default); border-bottom-color: var(--border-default); border-left-color: var(--border-default); border-top-left-radius: var(--radius-control); border-top-right-radius: var(--radius-control); border-bottom-left-radius: var(--radius-control); border-bottom-right-radius: var(--radius-control);`} /><figcaption craft="text, text-small">An order: items, totals, status and tracking link.</figcaption></figure></div>',
        p("You can also use the API directly:"),
        code("# 1. Create a product (starts as draft)",
             "curl -X POST $MERCHANT_URL/v1/products -H \"Authorization: Bearer sk_…\" \\",
             "  -H \"content-type: application/json\" -d '{\"title\":\"Everyday Mug\",\"description\":\"…\"}'",
             "",
             "# 2. Upload an image, then add a variant (price in cents)",
             "curl -X POST $MERCHANT_URL/v1/images -H \"Authorization: Bearer sk_…\" -F file=@mug.jpg",
             "curl -X POST $MERCHANT_URL/v1/products/PRODUCT_ID/variants -H \"Authorization: Bearer sk_…\" \\",
             "  -H \"content-type: application/json\" \\",
             "  -d '{\"sku\":\"MUG-SAND\",\"title\":\"Sand\",\"price_cents\":2800,\"image_url\":\"https://…/v1/images/…\"}'",
             "",
             "# 3. Add stock and publish",
             "curl -X POST $MERCHANT_URL/v1/inventory/MUG-SAND/adjust -H \"Authorization: Bearer sk_…\" \\",
             "  -H \"content-type: application/json\" -d '{\"delta\":40,\"reason\":\"restock\"}'",
             "curl -X PATCH $MERCHANT_URL/v1/products/PRODUCT_ID -H \"Authorization: Bearer sk_…\" \\",
             "  -H \"content-type: application/json\" -d '{\"status\":\"active\"}'"),
        bullets("Only `active` products appear in the shop. Product changes need no republish of the site.",
                "Merchant stores one image per variant. The product page turns them into a gallery: each thumbnail selects its variant, so photo, price and option always match. Products with one variant show a single photo.",
                "Cards show the first variant's image and price. Create the cheapest variant first so “From $X” is right.",
                "Discount codes are created with `POST /v1/discounts` and entered by shoppers on the cart page."),
    ]),
    ("design", "Changing the design", [
        p("The project follows [Craft](https://docs.webstudio.is/university/craft): theme variables → semantic variables → composite Tokens, all on Global Root. See the [style guide](/style-guide) for every color pairing, Token and extension."),
        table(["To change", "Edit"],
              ["Brand color", "`--seed-accent` (all accent shades derive from it)"],
              ["Neutral tone", "`--seed-neutral`"],
              ["Corner rounding", "`--theme-radius`"],
              ["Spacing density", "`--theme-space`"],
              ["Fonts", "`--theme-font-body`, `--theme-font-display` (upload fonts under Assets first)"],
              ["Dark mode", "Set `color-scheme` on Global Root to `light dark`. Every theme color already has a dark value."]),
        p("Tokens such as `button`, `card`, `heading` and `Product Card` only use semantic variables, so re-theming never requires editing a Token."),
    ]),
    ("hooks", "Moving and restyling elements", [
        p("`bridge.js` finds elements by `data-*` attributes, not by position or class. Restyle or move anything freely, but keep these attributes (Settings → Attributes) on the element that should do the job:"),
        table(["Attribute", "Where", "Purpose"],
              ["`data-cart-open`, `data-cart-close`", "Buttons", "Open and close the cart drawer"],
              ["`data-cart-drawer`", "Dialog in Header", "The cart drawer"],
              ["`data-cart-count`", "Badge", "Number of items; hidden when empty"],
              ["`data-cart-lines`", "List", "Cart lines are rendered here"],
              ["`data-cart-line-template`", "One list item", "Design for a cart line; its `data-field` children are filled in"],
              ["`data-cart-empty`, `data-cart-summary`, `data-cart-subtotal`", "Cart", "Empty state, totals"],
              ["`data-add-to-cart`", "Product form", "Adds the chosen variant; needs inputs named `sku` and `qty`"],
              ["`data-checkout-form`", "Cart page form", "Inputs named `email`, `phone`, `name`, `line1`, `line2`, `city`, `state`, `postal_code`, `country`; optional `discount`"],
              ["`data-checkout-fields`, `data-checkout-address`", "Cart page", "Customer details (hidden while paying); the address part (hidden in hosted mode)"],
              ["`data-checkout-actions`, `data-checkout-payment`, `data-checkout-mount`", "Cart page", "Discount and button; the payment section; where Stripe's box mounts"],
              ["`data-signin-form`, `data-account-signed-in`, `data-account-signed-out`", "Account page", "Sign-in and the two account states"],
              ["`data-order-template`, `data-orders-list`", "Account page", "Design for one order in the history"]),
    ]),
    ("orders", "Fulfilling orders", [
        p("Orders appear in Merchant once Stripe confirms payment. Mark an order as shipped with a tracking link, and the customer sees it in their account:"),
        code("curl -X PATCH $MERCHANT_URL/v1/orders/ORDER_ID -H \"Authorization: Bearer sk_…\" \\",
             "  -H \"content-type: application/json\" \\",
             "  -d '{\"status\":\"shipped\",\"tracking_number\":\"1Z…\",\"tracking_url\":\"https://…\"}'"),
        p("Refunds: `POST /v1/orders/ORDER_ID/refund`, optionally with `amount_cents` for a partial refund. Merchant can also call your own webhooks on `order.created`, `order.shipped` and `inventory.low`."),
    ]),
    ("security", "Keys and security", [
        table(["Secret", "Lives in", "Never in"],
              ["Merchant admin key `sk_…`", "Account Worker secret, your password manager", "Webstudio, the browser, git"],
              ["Stripe secret key `sk_…`", "Merchant secret + Merchant config", "Webstudio, the browser, git"],
              ["Stripe webhook secret `whsec_…`", "Merchant config", "Anywhere public"]),
        bullets("Sign-in links work once and expire after 15 minutes; sessions last 30 days. Only SHA-256 hashes of tokens are stored.",
                "The account Worker answers only origins listed in `SITE_ORIGIN` and `ALLOWED_ORIGINS`.",
                "Prices always come from Merchant at checkout; the browser cart can't change what a shopper pays."),
    ]),
    ("limits", "Good to know", [
        bullets("Merchant has no product slugs or categories. Product URLs use the product ID, and the shop is one list.",
                "Stock is not visible with the public key. If an item runs out, the shopper gets a clear message at checkout.",
                "The legal pages contain placeholder text. Replace it before you launch.",
                "Merchant keeps inventory reserved while a checkout is open; abandoned sessions release it when they expire."),
    ]),
    ("merchant-changes", "Changes to Merchant", [
        p("The template uses unmodified [Merchant](https://github.com/ygwyg/merchant) plus `merchant.patch`: four small, backwards-compatible additions for the embedded checkout and one bug fix for stock reservations (about 110 lines in `src/`). Existing Merchant clients keep working. The hosted checkout needs none of the additions, but the stock fix is worth applying either way. The patch was checked against Merchant commit `1b42cbb`."),
        table(["Change", "What it does", "Why the template needs it"],
              ["Embedded checkout", "`POST /v1/carts/:id/checkout` accepts `ui_mode: \"embedded\"` with a `return_url` and then returns a `client_secret` instead of `checkout_url`. Hosted checkout stays the default.", "Stripe's payment form shows on your own `/cart` page instead of redirecting to stripe.com."],
              ["`STRIPE_AUTOMATIC_TAX`", "Setting it to `\"false\"` creates checkout sessions without Stripe Tax. Without the setting, behaviour is unchanged (tax on).", "Upstream always enables Stripe Tax, so checkout fails until Stripe Tax is activated. New shops can now start selling first."],
              ["Line item names", "Cart items are named “Product – Variant”, for example “Beeswax Candle – Large”.", "Upstream uses only the variant title (“Large”), which is unclear on Stripe, receipts and order history."],
              ["Address from your form", "Checkout accepts a `shipping_address` object. Stripe then does not ask for an address, and the webhook stores it on the order.", "Lets the checkout form be designed in Webstudio, with only the payment in Stripe's box."],
              ["Stripe key fallback", "When the Worker has no Stripe secrets, Merchant uses the keys saved by `POST /v1/setup/stripe`.", "Upstream reads the key from two different places; now connecting Stripe once (the setup script) is enough."],
              ["Stock reservations (bug fix)", "Abandoned checkouts release their reserved stock when Stripe expires the session (after 30 minutes, via `checkout.session.expired`). Expired carts no longer push `reserved` below zero.", "Upstream never releases abandoned checkouts, and its cart cleanup makes `reserved` negative, which inflates available stock and can oversell."]),
        p("If Merchant changes and the patch no longer applies, `git apply --3way ../webstudio-merchant-template/merchant.patch` usually resolves it. These changes are good candidates for a pull request upstream; once merged, the patch step goes away."),
    ]),
]

toc = "".join(
    f'<li><a href="#{sid}" craft="link" ws:style={{css`text-decoration-line: none; font-size: var(--font-size-1); color: var(--foreground-secondary);`}}>{esc(title)}</a></li>'
    for sid, title, _ in SECTIONS)

sections = "".join(
    f'<section id="{sid}" ws:label="Doc {esc(title)}" craft="stack" ws:style={{css`scroll-margin-top: 6rem;`}}>'
    f'<h2 craft="heading, heading-m">{esc(title)}</h2>{"".join(body)}</section>'
    for sid, title, body in SECTIONS)

fragment = f'''<main id="main" ws:label="Main" ws:style={{css`flex-grow: 1;`}}>
<section ws:label="Section Docs" craft="section" ws:style={{css`padding-top: var(--gap-l);`}}>
<div ws:label="Container" craft="container, stack" ws:style={{css`row-gap: var(--gap-l);`}}>
  <div ws:label="Docs Intro" craft="stack, stack-small" ws:style={{css`max-width: var(--width-prose);`}}>
    <p craft="eyebrow">Template documentation</p>
    <h1 craft="heading, heading-xl">Set up your shop</h1>
    <p craft="text, text-large">A Webstudio shop on Merchant and Stripe, with customer accounts. About 30 minutes from template to first test order.</p>
    <p craft="text, text-small">Provided by <a href="https://elecos.de" target="_blank" rel="noopener" craft="link">ELECOS</a>. The footer credits ELECOS and links to its imprint; replace both with your own details when you use the template.</p>
  </div>
  <div ws:label="Docs Layout" ws:style={{css`display: grid; grid-template-columns: 14rem minmax(0, 1fr); column-gap: var(--gap-l); row-gap: var(--gap-m); align-items: start;`}}>
    <nav ws:label="Docs Contents" aria-label="On this page" ws:style={{css`position: sticky; top: 6rem;`}}>
      <p craft="eyebrow" ws:style={{css`color: var(--foreground-secondary); margin-bottom: var(--size-3);`}}>On this page</p>
      <ol craft="stack, stack-small" ws:style={{css`list-style-type: none; margin-top: 0; margin-bottom: 0; padding-left: 0;`}}>{toc}</ol>
    </nav>
    <div ws:label="Docs Body" craft="stack" ws:style={{css`row-gap: var(--gap-l); max-width: 48rem; min-width: 0;`}}>{sections}</div>
  </div>
</div>
</section>
</main>'''

with open("webstudio/fragments/docs-main.jsx", "w") as f:
    f.write(fragment)
print(len(fragment), "chars,", len(SECTIONS), "sections")
