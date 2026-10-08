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
const custom = { desktop: { scale: 125 }, mobile: { scale: 85 } };
test('image sizes are bounded and saved movement offsets are discarded', () => {
  assert.deepEqual(defaults, { desktop: { scale: 100 }, mobile: { scale: 100 } });
  assert.deepEqual(placement.normalizeHeroImagePlacement({ desktop: { scale: Infinity, x: -999, y: 999 }, mobile: { scale: 1000, x: '30', y: null } }), { desktop: { scale: 100 }, mobile: { scale: 180 } });
  assert.deepEqual(placement.normalizeHeroImagePlacement({ mobile: { scale: 40 } }, custom), { desktop: custom.desktop, mobile: { scale: 40 } });
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
  const id = new ObjectId(); let row = { _id: id, title: 'Hero', section: 'secondary', tickerText: 'Saved strip', imagePlacement: custom };
  const db = { collection: () => ({ findOne: async () => row, updateOne: async (_, update) => { row = { ...row, ...update.$set }; } }) };
  const heroes = load('src/lib/mongodb-hero.ts', { mongodb: { ObjectId }, '@/lib/mongodb': { getDb: async () => db }, '@/lib/hero-image-placement': placement });
  await heroes.updateHeroSlide(String(id), { title: 'Updated' });
  assert.deepEqual(row.imagePlacement, custom);
  const updated = await heroes.updateHeroSlide(String(id), { imagePlacement: { mobile: { scale: 110 } } });
  assert.equal(updated.section, "secondary"); assert.equal(updated.tickerText, "Saved strip");
  assert.deepEqual(updated.imagePlacement, { desktop: custom.desktop, mobile: { scale: 110 } });
  delete row.imagePlacement;
  assert.deepEqual((await heroes.getHeroSlide(String(id))).imagePlacement, defaults);
});
test('existing first hero migrates once into an editable slide and never reappears after deletion', async () => {
  let settingsRow = { key: 'storefront', homeDefaultHeroEnabled: true, homeDefaultHeroTitle: 'Existing hero', homeDefaultHeroImageUrl: '/existing.png', homeDefaultHeroImagePlacement: { desktop: { scale: 125, x: -20 }, mobile: { scale: 85, y: 30 } } };
  let rows = [{ _id: new ObjectId(), title: 'Other', order: 5, enabled: true }];
  const db = { collection(name) {
    if (name === 'siteSettings') return { findOne: async () => settingsRow, updateOne: async (_, update) => { settingsRow = { ...settingsRow, ...update.$set }; } };
    return {
      updateOne: async (filter, update) => { if (!rows.some(row => String(row._id) === String(filter._id))) rows.push({ _id: filter._id, ...update.$setOnInsert }); },
      find: filter => {
        let limit = Infinity;
        const cursor = { sort: () => cursor, limit: count => { limit = count; return cursor; }, toArray: async () => rows.filter(row => !filter.enabled || row.enabled).sort((a,b) => a.order - b.order).slice(0, limit) };
        return cursor;
      },
    };
  } };
  const heroes = load('src/lib/mongodb-hero.ts', { mongodb: { ObjectId }, '@/lib/mongodb': { getDb: async () => db }, '@/lib/hero-image-placement': placement });
  const listed = await heroes.listHeroSlides({ enabledOnly: true });
  assert.equal(listed.length, 2); assert.equal(listed[0].title, 'Existing hero'); assert.equal(listed[0].imageUrl, '/existing.png');
  assert.deepEqual(listed[0].imagePlacement, custom); assert.equal(listed[0].imagePosition, 'center');
  assert.equal(settingsRow.homeDefaultHeroMigrated, true); assert.equal(settingsRow.homeDefaultHeroEnabled, false);
  assert.equal((await heroes.listHeroSlides()).length, 2);
  rows = rows.filter(row => String(row._id) !== listed[0].id);
  assert.equal((await heroes.listHeroSlides()).length, 1);
});
