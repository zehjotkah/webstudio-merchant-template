<div ws:label="Shop Runtime">
  <HtmlEmbed ws:label="Shop Base Styles" code="<style>[hidden]{display:none!important}html:has(dialog[open]:modal){overflow:hidden}@media (prefers-reduced-motion:no-preference){[data-cart-drawer][open]{animation:shop-drawer-in var(--duration-default) var(--easing-default)}}@keyframes shop-drawer-in{from{transform:translateX(100%)}to{transform:none}}</style>" />
  <HtmlEmbed ws:label="Shop Bridge" clientOnly={true} code={expression`'<script src="' + shop.accountUrl + '/bridge.js" defer></script>'`} />
</div>
