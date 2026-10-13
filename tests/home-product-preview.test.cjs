const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const moduleObject = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('src/components/HomeAllProductsSection.tsx', 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const deps = {
  'next/link': { default: props => React.createElement('a', props, props.children) },
  '@/components/UiIcons': { ArrowUpRightIcon: () => React.createElement('svg', { 'aria-hidden': true }) },
  './HomeProductGrid.module.css': { default: { grid: 'product-grid' } },
  '@/components/HomeProductGridCard': { HomeProductGridCard: ({ product }) => React.createElement('article', null, product.name) },
};
new Function('require', 'module', 'exports', code)(name => deps[name] || require(name), moduleObject, moduleObject.exports);
test('homepage preview shows at most six products with a separate full catalog link', () => {
  const products = Array.from({ length: 10 }, (_, index) => ({ id: String(index), name: `Product ${index}` }));
  const html = renderToStaticMarkup(React.createElement(moduleObject.exports.HomeAllProductsSection, { products, whatsappNumber: '', layout: 'rail' }));
  assert.equal((html.match(/<article>/g) || []).length, 6);
  assert.match(html, /href="\/products"/);
  assert.doesNotMatch(html, /Product 6|<input|<select/);
  const empty = renderToStaticMarkup(React.createElement(moduleObject.exports.HomeAllProductsSection, { products: [], whatsappNumber: '' }));
  assert.match(empty, /collection is coming soon/);
  assert.doesNotMatch(empty, /<article>/);
});
