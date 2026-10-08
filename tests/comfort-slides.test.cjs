const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path, dependencies = {}) {
  const result = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('require', 'module', 'exports', code)((name) => dependencies[name], result, result.exports);
  return result.exports;
}
const images = load('src/lib/product-images.ts');
const { getComfortSlides } = load('src/lib/comfort-slides.ts', { '@/lib/product-images': images });
const settings = { homeDefaultHeroEnabled: true, homeDefaultHeroTitle: 'First', homeDefaultHeroImageUrl: '/model.png', homeDefaultHeroImagePosition: 'center' };
const product = { id: 'p1', name: 'Shirt', slug: 'shirt', status: 'active', image: '/shirt.png', spotlight: true };
const now = Date.parse('2026-10-08T12:00:00Z');
const slide = (id, extra = {}) => ({ id, title: id, kind: 'custom', enabled: true, order: 0, ...extra });
test('only enabled, live campaigns rotate; built-in hero leads sorted extra slides', () => {
  const slides = [slide('last', { order: 2 }), slide('hidden', { enabled: false }), slide('future', { startsAt: '2026-10-09T00:00:00Z' }), slide('ended', { endsAt: '2026-10-08T12:00:00Z' }), slide('first', { order: 1, startsAt: '2026-10-08T12:00:00Z' })];
  assert.deepEqual(getComfortSlides(settings, slides, [product], now).map(s => s.id), ['default', 'first', 'last']);
  assert.equal(slides[0].id, 'last');
  assert.deepEqual(getComfortSlides({ ...settings, homeDefaultHeroEnabled: false }, [], [], now), []);
});
test('product slides use published product images and links; deleted or draft products stay hidden', () => {
  const slides = [slide('shirt', { kind: 'product', productId: 'p1' }), slide('deleted', { kind: 'product', productId: 'missing' }), slide('draft', { kind: 'product', productId: 'p2' })];
  const result = getComfortSlides({ ...settings, homeDefaultHeroEnabled: false }, slides, [product, { ...product, id: 'p2', status: 'draft' }], now);
  assert.equal(result.length, 1); assert.equal(result[0].imageUrl, '/shirt.png'); assert.equal(result[0].href, '/products/shirt'); assert.equal(result[0].product.id, 'p1');
});
test('custom images and actions are preserved without fake product fallbacks', () => {
  const result = getComfortSlides(settings, [slide('custom', { imageUrl: '/campaign.png', href: '/products?category=shirts', button: 'View shirts', imagePosition: 'right' })], [], now);
  assert.equal(result[0].product, undefined);
  assert.equal(result[1].imageUrl, '/campaign.png'); assert.equal(result[1].imagePosition, 'right'); assert.equal(result[1].href, '/products?category=shirts'); assert.equal(result[1].product, undefined);
});
