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
const placement = load('src/lib/hero-image-placement.ts');
const { getComfortSlides } = load('src/lib/comfort-slides.ts', { '@/lib/product-images': images, '@/lib/hero-image-placement': placement });
const settings = { homeDefaultHeroEnabled: true, homeDefaultHeroTitle: 'First', homeDefaultHeroImageUrl: '/model.png', homeDefaultHeroImagePosition: 'center' };
const product = { id: 'p1', name: 'Shirt', slug: 'shirt', status: 'active', image: '/shirt.png', spotlight: true };
const now = Date.parse('2026-10-08T12:00:00Z');
const slide = (id, extra = {}) => ({ id, title: id, kind: 'custom', enabled: true, order: 0, ...extra });
test('only enabled, live campaigns rotate in saved order without a built-in slide', () => {
  const slides = [slide('last', { order: 2 }), slide('hidden', { enabled: false }), slide('future', { startsAt: '2026-10-09T00:00:00Z' }), slide('ended', { endsAt: '2026-10-08T12:00:00Z' }), slide('first', { order: 1, startsAt: '2026-10-08T12:00:00Z' })];
  assert.deepEqual(getComfortSlides(slides, [product], now).map(s => s.id), ['first', 'last']);
  assert.equal(slides[0].id, 'last');
  assert.deepEqual(getComfortSlides([], [], now), []);
});
test('product slides use published product images and links; deleted or draft products stay hidden', () => {
  const slides = [slide('shirt', { kind: 'product', productId: 'p1' }), slide('deleted', { kind: 'product', productId: 'missing' }), slide('draft', { kind: 'product', productId: 'p2' })];
  const result = getComfortSlides(slides, [product, { ...product, id: 'p2', status: 'draft' }], now);
  assert.equal(result.length, 1); assert.equal(result[0].imageUrl, '/shirt.png'); assert.equal(result[0].href, '/products/shirt'); assert.equal(result[0].product.id, 'p1');
});
test('custom images and actions are preserved without fake product fallbacks', () => {
  const result = getComfortSlides([slide('custom', { imageUrl: '/campaign.png', href: '/products?category=shirts', button: 'View shirts', imagePosition: 'right' })], [], now);
  assert.equal(result[0].product, undefined);
  assert.equal(result[0].imageUrl, '/campaign.png'); assert.equal(result[0].imagePosition, 'center'); assert.equal(result[0].href, '/products?category=shirts'); assert.equal(result[0].product, undefined);
});

test('all configured slides are retained beyond twelve slides', () => {
  const slides = Array.from({ length: 20 }, (_, index) => slide(String(index), { order: index }));
  assert.equal(getComfortSlides(slides, [], now).length, 20);
});
test('first and second sections rotate independently and old slides remain in the first section', () => {
  const slides = [slide('old'), slide('first', { section: 'primary', order: 3 }), slide('campaign2', { section: 'secondary', order: 2 }), slide('campaign1', { section: 'secondary', order: 1 }), slide('hiddenCampaign', { section: 'secondary', enabled: false })];
  assert.deepEqual(getComfortSlides(slides, [], now).map(s => s.id), ['old', 'first']);
  assert.deepEqual(getComfortSlides(slides, [], now, 'secondary').map(s => s.id), ['campaign1', 'campaign2']);
});
test('campaign content uses saved text only and has no slide-count cap', () => {
  const slides = Array.from({ length: 20 }, (_, index) => slide(String(index), { section: 'secondary', subtitle: 'Campaign description', tickerText: 'Saved announcement', imageUrl: '/campaign.png', order: index }));
  const result = getComfortSlides(slides, [], now, 'secondary');
  assert.equal(result.length, 20); assert.equal(result[0].subtitle, 'Campaign description'); assert.equal(result[0].tickerText, 'Saved announcement');
  assert.equal(getComfortSlides([slide('empty', { section: 'secondary' })], [], now, 'secondary')[0].tickerText, '');
});
