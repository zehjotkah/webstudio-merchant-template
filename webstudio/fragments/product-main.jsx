<main id="main" ws:label="Main" ws:style={css`flex-grow: 1;`}>
  <section ws:label="Section Product" craft="section" ws:show={expression`product.ok && product.data.id ? true : false`} ws:style={css`padding-top: var(--gap-m);`}>
    <div ws:label="Container" craft="container, stack, stack-large">
      <nav aria-label="Breadcrumb" ws:label="Breadcrumb">
        <ol craft="cluster" ws:style={css`list-style-type: none; margin-top: 0; margin-bottom: 0; padding-left: 0; column-gap: var(--size-2); font-size: var(--font-size-1); color: var(--foreground-secondary);`}>
          <li><a href="/shop" craft="link" ws:style={css`color: var(--foreground-secondary);`}>Shop</a></li>
          <li aria-hidden="true">/</li>
          <li aria-current="page">{expression`product.data.title`}</li>
        </ol>
      </nav>
      <div ws:label="Product Layout" ws:style={css`display: grid; grid-template-columns: 1.1fr 1fr; column-gap: var(--gap-l); row-gap: var(--gap-m); align-items: start;`}>
        <div ws:label="Product Gallery" ws:style={css`position: relative; display: grid; place-items: center; aspect-ratio: 4 / 5; overflow: hidden; border-top-left-radius: var(--radius-surface); border-top-right-radius: var(--radius-surface); border-bottom-left-radius: var(--radius-surface); border-bottom-right-radius: var(--radius-surface); background-color: var(--background-secondary);`}>
          <span aria-hidden="true" ws:style={css`font-family: var(--font-family-heading); font-size: clamp(5rem, 12vw, 9rem); color: var(--foreground-muted);`}>{expression`(product.data.title ?? "").slice(0, 1)`}</span>
          <Image ws:label="Product Image" craft="Product Media" data-product-image="" ws:show={expression`product.data.variants.at(0).image_url ? true : false`} src={expression`product.data.variants.at(0).image_url ?? ""`} alt={expression`product.data.title`} ws:style={css`position: absolute; top: 0; left: 0; width: 100%; height: 100%;`} />
        </div>
        <div ws:label="Product Info" craft="stack, stack-large" ws:style={css`position: sticky; top: 6rem;`}>
          <div craft="stack, stack-small">
            <h1 craft="heading, heading-l">{expression`product.data.title`}</h1>
            <p data-product-price="" craft="Price, text, text-large" ws:style={css`color: var(--foreground-primary);`}>{expression`"$" + ((product.data.variants.at(0).price_cents - product.data.variants.at(0).price_cents % 100) / 100).toString() + "." + (100 + product.data.variants.at(0).price_cents % 100).toString().slice(1)`}</p>
          </div>
          <p craft="text">{expression`product.data.description ?? ""`}</p>
          <form ws:label="Add To Cart Form" data-add-to-cart="" data-product-id={expression`product.data.id`} data-product-title={expression`product.data.title`} craft="stack, stack-large">
            <fieldset ws:label="Variant Picker" ws:show={expression`product.data.variants.length > 1`} craft="stack, stack-small" ws:style={css`margin-left: 0; margin-right: 0; padding: 0; border-top-width: 0; border-right-width: 0; border-bottom-width: 0; border-left-width: 0; min-width: 0;`}>
              <legend craft="label" ws:style={css`margin-bottom: var(--size-2); padding: 0;`}>Option</legend>
              <div ws:label="Variant Options" craft="cluster" ws:style={css`column-gap: var(--size-2); row-gap: var(--size-2);`} />
            </fieldset>
            <input type="hidden" name="sku" ws:show={expression`product.data.variants.length === 1`} value={expression`product.data.variants.at(0).sku`} data-price={expression`"$" + ((product.data.variants.at(0).price_cents - product.data.variants.at(0).price_cents % 100) / 100).toString() + "." + (100 + product.data.variants.at(0).price_cents % 100).toString().slice(1)`} data-price-cents={expression`product.data.variants.at(0).price_cents.toString()`} data-variant={expression`product.data.variants.at(0).title`} data-image={expression`product.data.variants.at(0).image_url ?? ""`} />
            <div craft="field" ws:style={css`max-width: 7rem;`}>
              <label for="product-qty" craft="label">Quantity</label>
              <input id="product-qty" type="number" name="qty" min="1" max="99" inputmode="numeric" placeholder="1" required={true} craft="input" />
            </div>
            <div craft="stack, stack-small">
              <button type="submit" craft="button, button-large, button-full">Add to cart</button>
              <p data-cart-message="" role="status" aria-live="polite" craft="text, text-small" ws:style={css`min-height: 1.5em;`}></p>
            </div>
          </form>
          <ul ws:label="Product Assurances" craft="stack, stack-small" ws:style={css`list-style-type: none; margin-top: 0; margin-bottom: 0; padding-top: var(--gap-s); padding-left: 0; border-top-width: 1px; border-top-style: solid; border-top-color: var(--border-default); font-size: var(--font-size-1); color: var(--foreground-secondary);`}>
            <li>Ships in 2–4 business days</li>
            <li>Free returns within 30 days</li>
            <li>Secure checkout with Stripe</li>
          </ul>
        </div>
      </div>
    </div>
  </section>
  <section ws:label="Section Not Found" craft="section" ws:show={expression`product.ok && product.data.id ? false : true`}>
    <div ws:label="Container" craft="container, stack" ws:style={css`align-items: flex-start; max-width: var(--width-prose);`}>
      <p craft="eyebrow">Not found</p>
      <h1 craft="heading, heading-l">We couldn't find that product</h1>
      <p craft="text">It may have sold out or been removed from the shop.</p>
      <a href="/shop" craft="button">Back to the shop</a>
    </div>
  </section>
</main>
