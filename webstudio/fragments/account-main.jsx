<main id="main" ws:label="Main" ws:style={css`flex-grow: 1;`}>
  <section ws:label="Section Account" craft="section" ws:style={css`padding-top: var(--gap-l);`}>
    <div ws:label="Container" craft="container, stack, stack-large">
      <div ws:label="Signed Out" data-account-signed-out="" craft="card, stack, stack-large" ws:style={css`max-width: 28rem; margin-left: auto; margin-right: auto; width: 100%; box-sizing: border-box;`}>
        <div craft="stack, stack-small">
          <h1 craft="heading, heading-m">Sign in</h1>
          <p craft="text">Enter your email and we'll send you a secure sign-in link. No password needed.</p>
        </div>
        <form ws:label="Sign In Form" data-signin-form="" craft="stack">
          <div craft="field">
            <label for="signin-email" craft="label">Email</label>
            <input id="signin-email" type="email" name="email" autocomplete="email" required={true} placeholder="you@example.com" craft="input" />
          </div>
          <button type="submit" craft="button, button-large, button-full">Email me a sign-in link</button>
          <p data-signin-status="" role="status" aria-live="polite" craft="text, text-small"></p>
        </form>
        <p craft="text, text-small">Use the email address you checked out with to see your past orders.</p>
      </div>
      <div ws:label="Signed In" data-account-signed-in="" hidden={true} craft="stack, stack-large">
        <div ws:label="Account Header" craft="cluster" ws:style={css`justify-content: space-between; align-items: flex-end;`}>
          <div craft="stack, stack-small">
            <h1 craft="heading, heading-l">Your account</h1>
            <p craft="text">Signed in as <strong data-account-email="" ws:style={css`color: var(--foreground-primary);`}></strong></p>
          </div>
          <button type="button" data-signout="" craft="button, is-button-secondary">Sign out</button>
        </div>
        <h2 craft="heading, heading-s">Orders</h2>
        <div ws:label="Orders Empty" data-orders-empty="" hidden={true} craft="surface, stack" ws:style={css`align-items: flex-start;`}>
          <p craft="text">You haven't placed any orders yet.</p>
          <a href="/shop" craft="button">Start shopping</a>
        </div>
        <ul ws:label="Orders List" data-orders-list="" role="list" craft="stack" ws:style={css`list-style-type: none; margin-top: 0; margin-bottom: 0; padding-left: 0;`}>
          <li ws:label="Order Template" data-order-template="" hidden={true} craft="card, stack, stack-small">
            <div craft="cluster" ws:style={css`justify-content: space-between;`}>
              <div craft="cluster" ws:style={css`column-gap: var(--size-3);`}>
                <strong data-field="number" craft="Price">ORD-000000</strong>
                <span data-field="status" craft="badge">Paid</span>
              </div>
              <strong data-field="total" craft="Price">$0.00</strong>
            </div>
            <p data-field="date" craft="text, text-small">Date</p>
            <p data-field="items" craft="text, text-small" ws:style={css`color: var(--foreground-primary);`}>Items</p>
            <a data-field="tracking" href="#" target="_blank" rel="noopener noreferrer" hidden={true} craft="link" ws:style={css`font-size: var(--font-size-1);`}>Track shipment</a>
          </li>
        </ul>
      </div>
    </div>
  </section>
</main>
