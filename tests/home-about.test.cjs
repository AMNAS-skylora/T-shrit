const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(path, dependencies = {}) {
  const result = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'module', 'exports', code)(name => dependencies[name] || (name.startsWith('@/') || name === 'server-only' ? {} : require(name)), result, result.exports);
  return result.exports;
}
const empty = { homeAboutEnabled: true, homeAboutEyebrow: '', homeAboutTitle: '', homeAboutBody: '', homeAboutImages: [], homeAboutQualityPoints: [] };
const { HomeAboutSection } = load('src/components/HomeAboutSection.tsx');
const render = settings => renderToStaticMarkup(React.createElement(HomeAboutSection, { settings }));
test('About stays absent until configured and respects its visibility control', () => {
  assert.equal(render(empty), '');
  assert.equal(render({ ...empty, homeAboutEnabled: false, homeAboutTitle: 'Our tees', homeAboutImages: ['/tee.jpg'] }), '');
});
test('About renders only saved photos and quality copy without legacy demo details', () => {
  const html = render({ ...empty, homeAboutTitle: 'Our tees', homeAboutBody: 'Our saved story', homeAboutImages: ['/tee.jpg', '/stitch.jpg'], homeAboutQualityPoints: ['Our actual fabric specification'] });
  assert.match(html, /Our saved story/); assert.match(html, /Our actual fabric specification/);
  assert.match(html, /src="\/tee.jpg"/); assert.match(html, /src="\/stitch.jpg"/);
  assert.match(html, /loading="lazy"/); assert.match(html, /object-contain/);
  assert.doesNotMatch(html, /Balanced weight|Clean construction|Selected for feel/);
});
test('About saves through settings and unrelated updates preserve images and quality points', async () => {
  let row = { key: 'storefront', supportEmail: 'old@example.com' };
  const db = { collection: () => ({ findOne: async () => row, updateOne: async (_, update) => { row = { ...row, ...update.$set }; } }) };
  const settings = load('src/lib/mongodb-settings.ts', {
    '@/lib/mongodb': { getDb: async () => db },
    '@/lib/hero-image-placement': load('src/lib/hero-image-placement.ts'),
    '@/lib/homepage-layouts': load('src/lib/homepage-layouts.ts'),
    '@/data/store': { localStoreSettings: { ...empty, supportEmail: '' } },
  });
  await settings.saveStoreSettings({ homeAboutTitle: ' Our tees ', homeAboutImages: [' /tee.jpg ', ''], homeAboutQualityPoints: [' Saved fabric detail ', ''] });
  await settings.saveStoreSettings({ supportEmail: 'new@example.com' });
  const saved = await settings.getStoreSettingsFromDb();
  assert.equal(saved.homeAboutTitle, 'Our tees'); assert.deepEqual(saved.homeAboutImages, ['/tee.jpg']); assert.deepEqual(saved.homeAboutQualityPoints, ['Saved fabric detail']);
  assert.equal(saved.supportEmail, 'new@example.com');
  await settings.saveStoreSettings({ homeAboutImages: [], homeAboutQualityPoints: [], homeAboutEnabled: false });
  const removed = await settings.getStoreSettingsFromDb();
  assert.deepEqual(removed.homeAboutImages, []); assert.deepEqual(removed.homeAboutQualityPoints, []); assert.equal(removed.homeAboutEnabled, false);
});
