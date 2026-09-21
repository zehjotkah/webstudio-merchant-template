<header ws:label="Header" data-shop-api={expression`shop.apiUrl`} data-shop-key={expression`shop.publicKey`} data-shop-account={expression`shop.accountUrl`} data-shop-countries={expression`shop.shippingCountries.join(",")`} ws:style={css`position: sticky; top: 0; z-index: 20; background-color: var(--background-primary); border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: var(--border-default);`}>
  <a href="#main" ws:label="Skip Link" craft="button, button-small" ws:style={css`position: absolute; left: var(--gap-s); top: var(--size-2); transform: translateY(-200%);`}>Skip to content</a>
  <div ws:label="Container" craft="container" ws:style={css`display: flex; align-items: center; justify-content: space-between; min-height: 4.25rem; column-gap: var(--gap-s);`}>
    <a href="/" ws:label="Logo" aria-label="Hearth home" ws:style={css`font-family: var(--font-family-heading); font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; color: var(--foreground-primary); text-decoration-line: none;`}>Hearth</a>
    <nav aria-label="Main" ws:label="Nav Main" craft="cluster" ws:style={css`column-gap: var(--gap-m);`}>
      <a href="/shop" craft="link" ws:style={css`text-decoration-line: none; font-size: var(--font-size-1); font-weight: 500;`}>Shop</a>
      <a href="/#story" craft="link" ws:style={css`text-decoration-line: none; font-size: var(--font-size-1); font-weight: 500;`}>Our story</a>
    </nav>
    <div ws:label="Header Actions" craft="cluster" ws:style={css`column-gap: var(--size-1); flex-wrap: nowrap;`}>
      <a href="/account" ws:label="Account Link" craft="icon-button" aria-label="Your account" data-account-link="">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" /></svg>
      </a>
      <button type="button" ws:label="Cart Button" craft="icon-button" aria-label="Open cart" data-cart-open="" aria-haspopup="dialog">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h14l-1.2 12.2a1 1 0 0 1-1 .8H7.2a1 1 0 0 1-1-.8L5 8z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>
        <span ws:label="Cart Count" data-cart-count="" aria-hidden="true" hidden={true} ws:style={css`position: absolute; top: 3px; right: 1px; min-width: 1.125rem; height: 1.125rem; padding-left: 4px; padding-right: 4px; box-sizing: border-box; border-top-left-radius: var(--radius-pill); border-top-right-radius: var(--radius-pill); border-bottom-left-radius: var(--radius-pill); border-bottom-right-radius: var(--radius-pill); background-color: var(--background-accent); color: var(--foreground-on-accent); font-size: 0.6875rem; font-weight: 700; line-height: 1.125rem; text-align: center; font-variant-numeric: tabular-nums;`}>0</span>
      </button>
    </div>
  </div>
  <dialog ws:label="Cart Drawer" data-cart-drawer="" aria-labelledby="cart-drawer-title" ws:style={css`margin-top: 0; margin-bottom: 0; margin-right: 0; margin-left: auto; width: min(28rem, 100vw); max-width: 100vw; height: 100dvh; max-height: 100dvh; padding: 0; border-top-width: 0; border-right-width: 0; border-bottom-width: 0; border-left-width: 0; background-color: var(--background-primary); color: var(--foreground-primary); box-shadow: var(--shadow-raised);`}>
    <div ws:label="Drawer Layout" ws:style={css`display: flex; flex-direction: column; height: 100%;`}>
      <div ws:label="Drawer Header" ws:style={css`display: flex; align-items: center; justify-content: space-between; padding-top: var(--gap-s); padding-bottom: var(--gap-s); padding-left: var(--gap-m); padding-right: var(--gap-s); border-bottom-width: 1px; border-bottom-style: solid; border-bottom-color: var(--border-default);`}>
        <h2 id="cart-drawer-title" craft="heading, heading-s">Your cart</h2>
        <button type="button" craft="icon-button" aria-label="Close cart" data-cart-close="">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <div ws:label="Drawer Body" data-cart-body="" ws:style={css`flex-grow: 1; overflow-y: auto; padding-top: var(--gap-m); padding-bottom: var(--gap-m); padding-left: var(--gap-m); padding-right: var(--gap-m);`}>
        <div ws:label="Cart Empty" data-cart-empty="" craft="stack" ws:style={css`align-items: flex-start;`}>
          <p craft="text">Your cart is empty. Let's find something you'll use every day.</p>
          <a href="/shop" craft="button, is-button-secondary" data-cart-close="">Browse the shop</a>
        </div>
        <ul ws:label="Cart Lines" data-cart-lines="" role="list" craft="stack" ws:style={css`list-style-type: none; margin-top: 0; margin-bottom: 0; padding-left: 0; row-gap: var(--gap-m);`}>
          <li ws:label="Cart Line Template" data-cart-line-template="" hidden={true} ws:style={css`display: grid; grid-template-columns: 4.5rem 1fr auto; column-gap: var(--gap-s); align-items: start;`}>
            <div ws:label="Line Media" ws:style={css`aspect-ratio: 1 / 1; overflow: hidden; border-top-left-radius: var(--radius-control); border-top-right-radius: var(--radius-control); border-bottom-left-radius: var(--radius-control); border-bottom-right-radius: var(--radius-control); background-color: var(--background-secondary);`}>
              <img data-field="image" alt="" width="72" height="72" loading="lazy" ws:style={css`width: 100%; height: 100%; object-fit: cover;`} />
            </div>
            <div ws:label="Line Info" craft="stack, stack-small" ws:style={css`row-gap: var(--size-1);`}>
              <a href="/shop" data-field="title" ws:style={css`font-weight: 600; color: var(--foreground-primary); text-decoration-line: none;`}>Product</a>
              <span data-field="variant" craft="text, text-small">Variant</span>
              <div ws:label="Line Quantity" craft="cluster" ws:style={css`column-gap: var(--size-2); margin-top: var(--size-1);`}>
                <button type="button" craft="icon-button" data-qty-dec="" aria-label="Decrease quantity" ws:style={css`width: 2rem; height: 2rem; border-top-width: 1px; border-right-width: 1px; border-bottom-width: 1px; border-left-width: 1px; border-top-style: solid; border-right-style: solid; border-bottom-style: solid; border-left-style: solid; border-top-color: var(--border-default); border-right-color: var(--border-default); border-bottom-color: var(--border-default); border-left-color: var(--border-default);`}>−</button>
                <span data-field="qty" aria-live="polite" craft="Price" ws:style={css`min-width: 1.5rem; text-align: center;`}>1</span>
                <button type="button" craft="icon-button" data-qty-inc="" aria-label="Increase quantity" ws:style={css`width: 2rem; height: 2rem; border-top-width: 1px; border-right-width: 1px; border-bottom-width: 1px; border-left-width: 1px; border-top-style: solid; border-right-style: solid; border-bottom-style: solid; border-left-style: solid; border-top-color: var(--border-default); border-right-color: var(--border-default); border-bottom-color: var(--border-default); border-left-color: var(--border-default);`}>+</button>
                <button type="button" craft="link" data-remove="" ws:style={css`background-color: transparent; border-top-width: 0; border-right-width: 0; border-bottom-width: 0; border-left-width: 0; padding: 0; font-family: inherit; font-size: var(--font-size-0); color: var(--foreground-secondary);`}>Remove</button>
              </div>
            </div>
            <span data-field="line-total" craft="Price">$0.00</span>
          </li>
        </ul>
      </div>
      <div ws:label="Drawer Footer" data-cart-summary="" craft="stack" ws:style={css`padding-top: var(--gap-m); padding-bottom: var(--gap-m); padding-left: var(--gap-m); padding-right: var(--gap-m); border-top-width: 1px; border-top-style: solid; border-top-color: var(--border-default);`}>
        <div ws:style={css`display: flex; justify-content: space-between; align-items: baseline;`}>
          <span craft="text" ws:style={css`color: var(--foreground-primary);`}>Subtotal</span>
          <span data-cart-subtotal="" craft="Price" ws:style={css`font-size: var(--font-size-3);`}>$0.00</span>
        </div>
        <p craft="text, text-small">Shipping and taxes are calculated at checkout.</p>
        <a href="/cart" craft="button, button-large, button-full">Checkout</a>
      </div>
    </div>
  </dialog>
</header>
