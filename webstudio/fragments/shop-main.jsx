<main id="main" ws:label="Main" ws:style={css`flex-grow: 1;`}>
  <section ws:label="Section Catalog" craft="section" ws:style={css`padding-top: var(--gap-l);`}>
    <div ws:label="Container" craft="container, stack, stack-large">
      <div ws:label="Catalog Header" craft="cluster" ws:style={css`justify-content: space-between; align-items: flex-end;`}>
        <div craft="stack, stack-small" ws:style={css`max-width: var(--width-prose);`}>
          <p craft="eyebrow">Shop</p>
          <h1 craft="heading, heading-l">All products</h1>
          <p craft="text">Small-batch goods for the kitchen, the table and the rest of the home.</p>
        </div>
        <p craft="text, text-small" aria-live="polite">{expression`(products.data.items.length ?? 0).toString() + (products.data.items.length === 1 ? " product" : " products")`}</p>
      </div>
      <div ws:label="Catalog Empty" craft="surface, stack" ws:show={expression`(products.data.items.length ?? 0) === 0`}>
        <h2 craft="heading, heading-s">Nothing here yet</h2>
        <p craft="text">New pieces are on their way. Check back soon.</p>
      </div>
      <div ws:label="Shop Products" craft="Product Grid" />
    </div>
  </section>
</main>
