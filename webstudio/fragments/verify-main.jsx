<main id="main" ws:label="Main" ws:style={css`flex-grow: 1;`}>
  <section ws:label="Section Verify" craft="section">
    <div ws:label="Container" craft="container, stack" ws:style={css`max-width: 28rem; align-items: flex-start;`}>
      <h1 craft="heading, heading-m">Signing you in…</h1>
      <p data-verify-status="" role="status" aria-live="polite" craft="text">One moment while we check your link.</p>
      <a href="/account" data-verify-retry="" hidden={true} craft="button, is-button-secondary">Request a new link</a>
    </div>
  </section>
</main>
