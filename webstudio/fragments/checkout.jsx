<div ws:label="Container" craft="container">
<form ws:label="Checkout" data-checkout-form="" ws:style={css`display: grid; grid-template-columns: 1.4fr 1fr; column-gap: var(--gap-l); row-gap: var(--gap-l); align-items: start;`}>
  <div ws:label="Checkout Main" craft="stack, stack-large">
    <h1 craft="heading, heading-l">Checkout</h1>
    <div ws:label="Cart Empty" data-cart-empty="" craft="surface, stack" ws:style={css`align-items: flex-start;`}>
      <p craft="text">Your cart is empty. Let's find something you'll use every day.</p>
      <a href="/shop" craft="button">Browse the shop</a>
    </div>
    <ul ws:label="Cart Lines" data-cart-lines="" role="list" craft="stack" ws:style={css`list-style-type: none; margin-top: 0; margin-bottom: 0; padding-left: 0; row-gap: var(--gap-m);`} />
    <div ws:label="Checkout Fields" data-checkout-fields="" data-cart-summary="" craft="stack, stack-large">
      <fieldset ws:label="Contact" ws:style={css`margin-left: 0; margin-right: 0; padding: 0; border-top-width: 0; border-right-width: 0; border-bottom-width: 0; border-left-width: 0; min-width: 0;`}>
        <legend craft="heading, heading-s" ws:style={css`padding: 0; margin-bottom: var(--gap-s);`}>Contact</legend>
        <div ws:style={css`display: grid; grid-template-columns: 1fr 1fr; gap: var(--gap-s);`} ws:label="Contact Fields">
          <div craft="field"><label for="checkout-email" craft="label">Email</label><input id="checkout-email" type="email" name="email" autocomplete="email" required={true} placeholder="you@example.com" data-checkout-email="" craft="input" /></div>
          <div craft="field"><label for="checkout-phone" craft="label">Phone <span ws:style={css`font-weight: 400; color: var(--foreground-secondary);`}>(optional)</span></label><input id="checkout-phone" type="tel" name="phone" autocomplete="tel" craft="input" /></div>
        </div>
      </fieldset>
      <fieldset ws:label="Shipping Address" ws:style={css`margin-left: 0; margin-right: 0; padding: 0; border-top-width: 0; border-right-width: 0; border-bottom-width: 0; border-left-width: 0; min-width: 0;`}>
        <legend craft="heading, heading-s" ws:style={css`padding: 0; margin-bottom: var(--gap-s);`}>Shipping address</legend>
        <div craft="stack" ws:label="Address Fields">
          <div craft="field"><label for="checkout-name" craft="label">Full name</label><input id="checkout-name" type="text" name="name" autocomplete="shipping name" required={true} craft="input" /></div>
          <div craft="field"><label for="checkout-line1" craft="label">Address</label><input id="checkout-line1" type="text" name="line1" autocomplete="shipping address-line1" required={true} craft="input" /></div>
          <div craft="field"><label for="checkout-line2" craft="label">Apartment, suite, etc. <span ws:style={css`font-weight: 400; color: var(--foreground-secondary);`}>(optional)</span></label><input id="checkout-line2" type="text" name="line2" autocomplete="shipping address-line2" craft="input" /></div>
          <div ws:label="City Row" ws:style={css`display: grid; grid-template-columns: 2fr 1fr 1fr; gap: var(--gap-s);`}>
            <div craft="field"><label for="checkout-city" craft="label">City</label><input id="checkout-city" type="text" name="city" autocomplete="shipping address-level2" required={true} craft="input" /></div>
            <div craft="field"><label for="checkout-state" craft="label">State <span ws:style={css`font-weight: 400; color: var(--foreground-secondary);`}>(optional)</span></label><input id="checkout-state" type="text" name="state" autocomplete="shipping address-level1" craft="input" /></div>
            <div craft="field"><label for="checkout-zip" craft="label">ZIP code</label><input id="checkout-zip" type="text" name="postal_code" autocomplete="shipping postal-code" required={true} craft="input" /></div>
          </div>
          <div craft="field">
            <label for="checkout-country" craft="label">Country</label>
            <select id="checkout-country" name="country" autocomplete="shipping country" required={true} craft="input">
              <option value="US">United States</option>
              <option value="CA">Canada</option>
            </select>
          </div>
        </div>
      </fieldset>
    </div>
    <div ws:label="Payment" data-checkout-payment="" hidden={true} craft="stack" ws:style={css`scroll-margin-top: 6rem;`}>
      <div ws:label="Payment Header" craft="cluster" ws:style={css`justify-content: space-between;`}>
        <h2 craft="heading, heading-s">Payment</h2>
        <button type="button" data-checkout-cancel="" craft="button, is-button-ghost, button-small">Edit details</button>
      </div>
      <p ws:label="Address Summary" data-checkout-address-summary="" craft="text, text-small"></p>
      <div ws:label="Demo Notice" role="note" craft="stack, stack-small" ws:style={css`padding: var(--gap-s); row-gap: var(--size-1); border-top-left-radius: var(--radius-control); border-top-right-radius: var(--radius-control); border-bottom-left-radius: var(--radius-control); border-bottom-right-radius: var(--radius-control); background-color: var(--background-warning-subtle);`}>
        <strong ws:style={css`font-size: var(--font-size-1); color: var(--foreground-primary);`}>This is a demo shop — no real payments</strong>
        <p craft="text, text-small" ws:style={css`color: var(--foreground-primary);`}>Pay with the Stripe test card <code craft="code">4242 4242 4242 4242</code>, any future expiry date, any three-digit CVC.</p>
      </div>
      <div ws:label="Payment Frame" data-checkout-mount="" ws:style={css`min-height: 22rem;`} />
    </div>
  </div>
  <aside ws:label="Order Summary" aria-labelledby="summary-title" data-cart-summary="" craft="surface, stack, stack-large" ws:style={css`position: sticky; top: 6rem;`}>
    <h2 id="summary-title" craft="heading, heading-s">Order summary</h2>
    <dl ws:label="Summary Rows" craft="stack, stack-small" ws:style={css`margin-top: 0; margin-bottom: 0;`}>
      <div ws:style={css`display: flex; justify-content: space-between;`}><dt craft="text">Subtotal</dt><dd data-cart-subtotal="" craft="Price" ws:style={css`margin-left: 0;`}>$0.00</dd></div>
      <div ws:style={css`display: flex; justify-content: space-between;`}><dt craft="text">Shipping</dt><dd craft="text" ws:style={css`margin-left: 0;`}>Free</dd></div>
    </dl>
    <hr craft="divider" />
    <div ws:label="Checkout Actions" data-checkout-actions="" craft="stack">
      <details ws:label="Discount" ws:style={css`font-size: var(--font-size-1);`}>
        <summary ws:style={css`cursor: pointer; color: var(--foreground-secondary);`}>Have a discount code?</summary>
        <div craft="field" ws:style={css`margin-top: var(--size-2);`}>
          <label for="checkout-discount" craft="label, visually-hidden">Discount code</label>
          <input id="checkout-discount" type="text" name="discount" autocomplete="off" placeholder="Discount code" craft="input" ws:style={css`text-transform: uppercase;`} />
        </div>
      </details>
      <p data-checkout-error="" role="alert" hidden={true} craft="text, text-small" ws:style={css`color: var(--foreground-negative);`}></p>
      <button type="submit" data-checkout-submit="" craft="button, button-large, button-full">Continue to payment</button>
      <p craft="text, text-small" ws:style={css`text-align: center;`}>Next, pay securely with Stripe. No account needed.</p>
    </div>
  </aside>
</form>
</div>