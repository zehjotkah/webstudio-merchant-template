<main id="main" ws:label="Main" ws:style={css`flex-grow: 1;`}>
  <section ws:label="Section Confirmation" craft="section">
    <div ws:label="Container" craft="container, stack, stack-large" ws:style={css`max-width: 40rem;`}>
      <div ws:label="Confirmation Icon" aria-hidden="true" ws:style={css`display: grid; place-items: center; width: 3.5rem; height: 3.5rem; border-top-left-radius: var(--radius-pill); border-top-right-radius: var(--radius-pill); border-bottom-left-radius: var(--radius-pill); border-bottom-right-radius: var(--radius-pill); background-color: var(--background-positive-subtle); color: var(--foreground-positive);`}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
      </div>
      <div craft="stack, stack-small">
        <h1 craft="heading, heading-l">Thank you for your order</h1>
        <p craft="text, text-large">Your payment went through. A receipt is on its way to your inbox.</p>
      </div>
      <div ws:label="Order Details" data-order-confirmation="" craft="card, stack" hidden={true}>
        <div craft="cluster" ws:style={css`justify-content: space-between;`}>
          <span craft="text">Order</span>
          <strong data-order-field="number" craft="Price">—</strong>
        </div>
        <div craft="cluster" ws:style={css`justify-content: space-between;`}>
          <span craft="text">Email</span>
          <span data-order-field="email" ws:style={css`color: var(--foreground-primary);`}>—</span>
        </div>
        <div craft="cluster" ws:style={css`justify-content: space-between;`}>
          <span craft="text">Total paid</span>
          <strong data-order-field="total" craft="Price">—</strong>
        </div>
      </div>
      <p data-order-pending="" craft="text, text-small" hidden={true}>We're finalising your order. It will appear in your account within a minute.</p>
      <div craft="cluster">
        <a href="/shop" craft="button">Continue shopping</a>
        <a href="/account" craft="button, is-button-secondary">View your orders</a>
      </div>
    </div>
  </section>
</main>
