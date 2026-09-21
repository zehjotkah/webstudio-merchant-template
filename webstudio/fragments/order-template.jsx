<li ws:label="Order Template" data-order-template="" hidden={true} craft="card, stack">
  <div ws:label="Order Header" craft="cluster" ws:style={css`justify-content: space-between;`}>
    <div craft="cluster" ws:style={css`column-gap: var(--size-3);`}>
      <strong data-field="number" craft="Price">ORD-000000</strong>
      <span data-field="status" craft="badge">Paid</span>
    </div>
    <strong data-field="total" craft="Price">$0.00</strong>
  </div>
  <p data-field="date" craft="text, text-small">Placed on …</p>
  <p data-field="items" craft="text, text-small" ws:style={css`color: var(--foreground-primary);`}>Items</p>
  <a data-field="tracking" href="#" target="_blank" rel="noopener noreferrer" hidden={true} craft="link" ws:style={css`font-size: var(--font-size-1);`}>Track shipment</a>
  <details ws:label="Order Details" ws:style={css`border-top-width: 1px; border-top-style: solid; border-top-color: var(--border-default); padding-top: var(--gap-xs);`}>
    <summary ws:style={css`cursor: pointer; font-size: var(--font-size-1); font-weight: 600; color: var(--foreground-primary);`}>Order details</summary>
    <div ws:label="Order Details Body" ws:style={css`display: grid; grid-template-columns: 1.4fr 1fr; gap: var(--gap-m); padding-top: var(--gap-s);`}>
      <div craft="stack, stack-small">
        <ul ws:label="Order Items" data-order-items="" role="list" craft="stack, stack-small" ws:style={css`list-style-type: none; margin-top: 0; margin-bottom: 0; padding-left: 0;`}>
          <li ws:label="Order Item Template" data-order-item-template="" hidden={true} ws:style={css`display: flex; justify-content: space-between; column-gap: var(--gap-s); font-size: var(--font-size-1);`}>
            <span data-field="item" ws:style={css`color: var(--foreground-primary);`}>1 × Item</span>
            <span data-field="line" craft="Price">$0.00</span>
          </li>
        </ul>
        <hr craft="divider" />
        <dl ws:label="Order Totals" craft="stack, stack-small" ws:style={css`margin-top: 0; margin-bottom: 0; row-gap: var(--size-1); font-size: var(--font-size-1);`}>
          <div ws:style={css`display: flex; justify-content: space-between;`}><dt craft="text, text-small">Subtotal</dt><dd data-field="subtotal" ws:style={css`margin-left: 0;`}>$0.00</dd></div>
          <div data-row="discount" ws:style={css`display: flex; justify-content: space-between;`}><dt craft="text, text-small">Discount</dt><dd data-field="discount" ws:style={css`margin-left: 0;`}>−$0.00</dd></div>
          <div ws:style={css`display: flex; justify-content: space-between;`}><dt craft="text, text-small">Shipping</dt><dd data-field="shipping" ws:style={css`margin-left: 0;`}>Free</dd></div>
          <div data-row="tax" ws:style={css`display: flex; justify-content: space-between;`}><dt craft="text, text-small">Tax</dt><dd data-field="tax" ws:style={css`margin-left: 0;`}>$0.00</dd></div>
          <div ws:style={css`display: flex; justify-content: space-between; font-weight: 700;`}><dt>Total</dt><dd data-field="grand-total" craft="Price" ws:style={css`margin-left: 0;`}>$0.00</dd></div>
        </dl>
      </div>
      <div craft="stack, stack-small">
        <p craft="label">Shipping address</p>
        <p data-field="address" craft="text, text-small" ws:style={css`white-space: pre-line; color: var(--foreground-primary);`}>—</p>
      </div>
    </div>
  </details>
</li>
