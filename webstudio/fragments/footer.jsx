<footer ws:label="Footer" ws:style={css`background-color: var(--background-secondary); border-top-width: 1px; border-top-style: solid; border-top-color: var(--border-default); padding-top: var(--gap-l); padding-bottom: var(--gap-m);`}>
  <div ws:label="Container" craft="container, stack, stack-large">
    <div ws:label="Footer Columns" ws:style={css`display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; column-gap: var(--gap-m); row-gap: var(--gap-m);`}>
      <div ws:label="Footer Brand" craft="stack, stack-small" ws:style={css`max-width: 22rem;`}>
        <a href="/" ws:style={css`font-family: var(--font-family-heading); font-size: 1.5rem; font-weight: 600; letter-spacing: -0.02em; color: var(--foreground-primary); text-decoration-line: none;`}>Hearth</a>
        <p craft="text, text-small">Well-made objects for everyday rituals, from small studios we know by name.</p>
      </div>
      <nav aria-label="Shop" craft="stack, stack-small">
        <h2 craft="eyebrow" ws:style={css`color: var(--foreground-secondary);`}>Shop</h2>
        <a href="/shop" craft="link" ws:style={css`text-decoration-line: none; font-size: var(--font-size-1);`}>All products</a>
        <a href="/cart" craft="link" ws:style={css`text-decoration-line: none; font-size: var(--font-size-1);`}>Your cart</a>
      </nav>
      <nav aria-label="Help" craft="stack, stack-small">
        <h2 craft="eyebrow" ws:style={css`color: var(--foreground-secondary);`}>Help</h2>
        <a href="/account" craft="link" ws:style={css`text-decoration-line: none; font-size: var(--font-size-1);`}>Your account</a>
        <a href="/shipping-returns" craft="link" ws:style={css`text-decoration-line: none; font-size: var(--font-size-1);`}>Shipping &amp; returns</a>
        <a href="mailto:hello@example.com" craft="link" ws:style={css`text-decoration-line: none; font-size: var(--font-size-1);`}>Contact us</a>
      </nav>
      <nav aria-label="Legal" craft="stack, stack-small">
        <h2 craft="eyebrow" ws:style={css`color: var(--foreground-secondary);`}>Legal</h2>
        <a href="/terms" craft="link" ws:style={css`text-decoration-line: none; font-size: var(--font-size-1);`}>Terms of service</a>
        <a href="/privacy" craft="link" ws:style={css`text-decoration-line: none; font-size: var(--font-size-1);`}>Privacy policy</a>
      </nav>
    </div>
    <hr craft="divider" />
    <div ws:label="Footer Bottom" craft="cluster" ws:style={css`justify-content: space-between;`}>
      <p craft="text, text-small">© 2026 Hearth. All rights reserved.</p>
      <p craft="text, text-small">Secure payments by Stripe</p>
    </div>
  </div>
</footer>
