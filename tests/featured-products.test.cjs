const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const moduleObject = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('src/lib/featured-products.ts', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
new Function('require', 'module', 'exports', code)(name => name === '@/lib/product-images' ? { getProductPrimaryImage: product => product.image || product.colorVariants?.[0]?.image || '' } : require(name), moduleObject, moduleObject.exports);
test('featured showcase uses only selected active products with images in configured order', () => {
  const products = [
    { id: 'second', status: 'active', featured: true, image: '/two.png', featuredSortOrder: 2 },
    { id: 'off', status: 'active', featured: false, image: '/off.png' },
    { id: 'draft', status: 'draft', featured: true, image: '/draft.png' },
    { id: 'empty', status: 'active', featured: true },
    { id: 'sold', status: 'sold-out', featured: true, image: '/sold.png' },
    { id: 'first', status: 'active', featured: true, colorVariants: [{ image: '/one.png' }], featuredSortOrder: 1 },
  ];
  assert.deepEqual(moduleObject.exports.getFeaturedProducts(products).map(product => product.id), ['first', 'second']);
  assert.equal(products[0].id, 'second');
  assert.deepEqual(moduleObject.exports.getFeaturedProducts([]), []);
});
