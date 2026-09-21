<main id="main" ws:label="Main" ws:style={css`flex-grow: 1;`}>
  <section ws:label="Section Hero" craft="section">
    <div ws:label="Container" craft="container" ws:style={css`display: grid; grid-template-columns: 1.1fr 1fr; align-items: center; column-gap: var(--gap-l); row-gap: var(--gap-l);`}>
      <div ws:label="Hero Copy" craft="stack, stack-large" ws:style={css`max-width: 36rem;`}>
        <p craft="eyebrow">New season</p>
        <h1 craft="heading, heading-xl">Objects for slow, well-made days</h1>
        <p craft="text, text-large">Stoneware, linen and wood from small studios — made to be used every day and to last for years.</p>
        <div ws:label="Hero Actions" craft="cluster">
          <a href="/shop" craft="button, button-large">Shop the collection</a>
          <a href="#story" craft="button, is-button-secondary, button-large">Our story</a>
        </div>
      </div>
      <div ws:label="Hero Media" aria-hidden="true" ws:style={css`position: relative; overflow: hidden; aspect-ratio: 4 / 5; border-top-left-radius: var(--radius-surface); border-top-right-radius: var(--radius-surface); border-bottom-left-radius: var(--radius-surface); border-bottom-right-radius: var(--radius-surface); background-color: var(--background-accent-subtle);`}>
        <div ws:label="Hero Sun" ws:style={css`position: absolute; left: 20%; top: 16%; width: 60%; aspect-ratio: 1 / 1; border-top-left-radius: var(--radius-pill); border-top-right-radius: var(--radius-pill); border-bottom-left-radius: var(--radius-pill); border-bottom-right-radius: var(--radius-pill); background-color: var(--background-accent);`} />
        <div ws:label="Hero Table" ws:style={css`position: absolute; left: 0; right: 0; bottom: 0; height: 30%; background-color: var(--background-secondary);`} />
        <div ws:label="Hero Vessel" ws:style={css`position: absolute; left: 34%; bottom: 22%; width: 32%; height: 30%; border-top-left-radius: 40% 30%; border-top-right-radius: 40% 30%; border-bottom-left-radius: 18% 12%; border-bottom-right-radius: 18% 12%; background-color: var(--background-primary); box-shadow: var(--shadow-raised);`} />
      </div>
    </div>
  </section>
  <section ws:label="Section Featured" craft="section" ws:style={css`padding-top: 0;`}>
    <div ws:label="Container" craft="container, stack, stack-large">
      <div ws:label="Featured Header" craft="cluster" ws:style={css`justify-content: space-between; align-items: flex-end;`}>
        <div craft="stack, stack-small">
          <p craft="eyebrow">Bestsellers</p>
          <h2 craft="heading, heading-l">Loved by our customers</h2>
        </div>
        <a href="/shop" craft="link">View all products</a>
      </div>
      <div ws:label="Products" craft="Product Grid" />
    </div>
  </section>
  <section ws:label="Section Values" craft="section" ws:style={css`background-color: var(--background-secondary);`}>
    <div ws:label="Container" craft="container" ws:style={css`display: grid; grid-template-columns: repeat(3, 1fr); column-gap: var(--gap-m); row-gap: var(--gap-m);`}>
      <div ws:label="Value" craft="stack, stack-small">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ws:style={css`color: var(--foreground-accent);`}><path d="M12 3c3 3 5 6 5 9a5 5 0 0 1-10 0c0-3 2-6 5-9z" /></svg>
        <h3 craft="heading, heading-s">Made by hand</h3>
        <p craft="text, text-small">Every piece comes from a small studio. Slight variations are part of the charm.</p>
      </div>
      <div ws:label="Value" craft="stack, stack-small">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ws:style={css`color: var(--foreground-accent);`}><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></svg>
        <h3 craft="heading, heading-s">Secure checkout</h3>
        <p craft="text, text-small">Pay safely by card, Apple Pay or Google Pay — processed by Stripe.</p>
      </div>
      <div ws:label="Value" craft="stack, stack-small">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ws:style={css`color: var(--foreground-accent);`}><path d="M4 12a8 8 0 1 0 2.3-5.7" /><path d="M4 4v4h4" /></svg>
        <h3 craft="heading, heading-s">Easy returns</h3>
        <p craft="text, text-small">Changed your mind? Send it back within 30 days for a full refund.</p>
      </div>
    </div>
  </section>
  <section id="story" ws:label="Section Story" craft="section">
    <div ws:label="Container" craft="container" ws:style={css`display: grid; grid-template-columns: 1fr 1fr; column-gap: var(--gap-l); row-gap: var(--gap-m); align-items: start;`}>
      <div craft="stack">
        <p craft="eyebrow">Our story</p>
        <h2 craft="heading, heading-l">A small shop with a long view</h2>
      </div>
      <div craft="stack" ws:style={css`max-width: var(--width-prose);`}>
        <p craft="text">Hearth started with a single mug we couldn't stop using. Today we work with a handful of potters, weavers and woodworkers who care about how things are made — and how long they last.</p>
        <p craft="text">We keep our range small on purpose. Everything here is something we use at home, and we'd happily buy again.</p>
        <div><a href="/shop" craft="button, is-button-secondary">Browse the collection</a></div>
      </div>
    </div>
  </section>
</main>
