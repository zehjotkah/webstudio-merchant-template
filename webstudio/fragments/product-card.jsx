<a ws:label="Product Card" craft="Product Card" href={expression`"/product/" + collectionItem.id`}>
  <div ws:label="Card Media" ws:style={css`position: relative; display: grid; place-items: center; aspect-ratio: 4 / 5; overflow: hidden; border-top-left-radius: var(--radius-surface); border-top-right-radius: var(--radius-surface); border-bottom-left-radius: var(--radius-surface); border-bottom-right-radius: var(--radius-surface); background-color: var(--background-secondary);`}>
    <span ws:label="Media Placeholder" aria-hidden="true" ws:style={css`font-family: var(--font-family-heading); font-size: var(--font-size-6); color: var(--foreground-muted);`}>{expression`collectionItem.title.slice(0, 1)`}</span>
    <Image ws:label="Card Image" craft="Product Media" ws:show={expression`collectionItem.variants.at(0).image_url ? true : false`} src={expression`collectionItem.variants.at(0).image_url ?? ""`} alt={expression`collectionItem.title`} loading="lazy" ws:style={css`position: absolute; top: 0; left: 0; width: 100%; height: 100%;`} />
  </div>
  <div ws:label="Card Info" craft="stack, stack-small" ws:style={css`row-gap: var(--size-1);`}>
    <h3 ws:style={css`margin-top: 0; margin-bottom: 0; font-size: var(--font-size-2); font-weight: 600; line-height: 1.3; color: var(--foreground-primary);`}>{expression`collectionItem.title`}</h3>
    <p craft="Price, text, text-small" ws:style={css`color: var(--foreground-secondary);`}>{expression`(collectionItem.variants.length > 1 && collectionItem.variants.at(0).price_cents !== collectionItem.variants.at(-1).price_cents ? "From $" : "$") + ((collectionItem.variants.at(0).price_cents - collectionItem.variants.at(0).price_cents % 100) / 100).toString() + "." + (100 + collectionItem.variants.at(0).price_cents % 100).toString().slice(1)`}</p>
  </div>
</a>
