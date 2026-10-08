const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { ObjectId } = require('mongodb');
function load(path, dependencies = {}) {
  const result = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('require', 'module', 'exports', code)((name) => dependencies[name] || (name.startsWith('node:') ? require(name) : {}), result, result.exports);
  return result.exports;
}
const placement = load('src/lib/hero-image-placement.ts');
const defaults = placement.normalizeHeroImagePlacement();
const custom = { desktop: { scale: 125, x: -15, y: -5 }, mobile: { scale: 85, x: 10, y: 12 } };
test('legacy images retain their framing; invalid values fall back and extreme values are bounded', () => {
  assert.deepEqual(defaults, { desktop: { scale: 100, x: 0, y: 0 }, mobile: { scale: 100, x: 0, y: 0 } });
  assert.deepEqual(placement.normalizeHeroImagePlacement({ desktop: { scale: Infinity, x: -999, y: 999 }, mobile: { scale: 1000, x: '30', y: null } }), { desktop: { scale: 100, x: -60, y: 60 }, mobile: { scale: 180, x: 0, y: 0 } });
  assert.deepEqual(placement.normalizeHeroImagePlacement({ mobile: { scale: 40 } }, custom), { desktop: custom.desktop, mobile: { scale: 40, x: 10, y: 12 } });
});
test('first hero placement saves and reads without unrelated settings updates resetting it', async () => {
  let row = { key: 'storefront', homeDefaultHeroImagePlacement: custom, homeDefaultHeroEnabled: true };
  const db = { collection: () => ({ findOne: async () => row, updateOne: async (_, update) => { row = { ...row, ...update.$set }; } }) };
  const settings = load('src/lib/mongodb-settings.ts', {
    '@/lib/mongodb': { getDb: async () => db }, '@/lib/hero-image-placement': placement,
    '@/lib/homepage-layouts': load('src/lib/homepage-layouts.ts'),
    '@/data/store': { localStoreSettings: { homeDefaultHeroImagePlacement: defaults, homeDefaultHeroEnabled: false } },
  });
  assert.deepEqual((await settings.getStoreSettingsFromDb()).homeDefaultHeroImagePlacement, custom);
  await settings.saveStoreSettings({ homeDefaultHeroEnabled: false });
  assert.deepEqual(row.homeDefaultHeroImagePlacement, custom);
  await settings.saveStoreSettings({ homeDefaultHeroImagePlacement: defaults });
  assert.deepEqual((await settings.getStoreSettingsFromDb()).homeDefaultHeroImagePlacement, defaults);
});
test('custom hero placement survives edits, supports partial device patches and defaults for legacy slides', async () => {
  const id = new ObjectId(); let row = { _id: id, title: 'Hero', imagePlacement: custom };
  const db = { collection: () => ({ findOne: async () => row, updateOne: async (_, update) => { row = { ...row, ...update.$set }; } }) };
  const heroes = load('src/lib/mongodb-hero.ts', { mongodb: { ObjectId }, '@/lib/mongodb': { getDb: async () => db }, '@/lib/hero-image-placement': placement });
  await heroes.updateHeroSlide(String(id), { title: 'Updated' });
  assert.deepEqual(row.imagePlacement, custom);
  const updated = await heroes.updateHeroSlide(String(id), { imagePlacement: { mobile: { scale: 110 } } });
  assert.deepEqual(updated.imagePlacement, { desktop: custom.desktop, mobile: { scale: 110, x: 10, y: 12 } });
  delete row.imagePlacement;
  assert.deepEqual((await heroes.getHeroSlide(String(id))).imagePlacement, defaults);
});
