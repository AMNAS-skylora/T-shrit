const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const moduleResult = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('src/components/ComfortHero.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
new Function('require', 'module', 'exports', code)(name => {
  if (name === '@/lib/hero-image-placement') return { normalizeHeroImagePlacement: () => ({ desktop: { scale: 100 }, mobile: { scale: 100 } }), normalizeHeroImageOpacity: value => value };
  if (name === '@/lib/product-images') return { getProductPrimaryImage: product => product.image };
  if (name === 'next/link') return { default: props => React.createElement('a', props, props.children) };
  if (name.endsWith('.css')) return { default: { model: 'background', product: 'product-card' } };
  return require(name);
}, moduleResult, moduleResult.exports);
const { ComfortHero } = moduleResult.exports;
const props = { settings: { homeDefaultHeroTitle: 'Everyday', homeDefaultHeroImageUrl: '/background.jpg' }, products: [{ name: 'Tee', slug: 'tee', image: '/tee.jpg', price: 100, status: 'active' }] };
test('hero shows decorative background and readable title with no card by default', () => {
  const html = renderToStaticMarkup(React.createElement(ComfortHero, { ...props, imageOpacity: 35 }));
  assert.match(html, /Everyday/);
  assert.match(html, /alt="" class="background"/);
  assert.match(html, /--image-opacity:0.35/);
  assert.doesNotMatch(html, /product-card|href="\/products\/tee"/);
});
test('hero card appears only when enabled and a live product exists', () => {
  const render = extra => renderToStaticMarkup(React.createElement(ComfortHero, { ...props, ...extra }));
  assert.match(render({ showProductCard: true }), /href="\/products\/tee"/);
  assert.doesNotMatch(render({ showProductCard: false }), /product-card/);
  assert.doesNotMatch(render({ showProductCard: true, products: [] }), /product-card/);
  assert.doesNotMatch(render({ showProductCard: true, products: props.products.map(product => ({ ...product, status: 'draft' })) }), /product-card/);
});
