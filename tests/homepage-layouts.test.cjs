const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const result = {exports:{}};
const code = ts.transpileModule(fs.readFileSync('src/lib/homepage-layouts.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
new Function('module','exports',code)(result,result.exports);
const {normalizeHomepageLayouts}=result.exports;
test('existing stores and invalid saved layouts retain compatible defaults',()=>{
  const defaults={homeHeroLayout:'original',homeCatalogLayout:'grid',homeFeaturedLayout:'motion'};
  assert.deepEqual(normalizeHomepageLayouts({}),defaults);
  assert.deepEqual(normalizeHomepageLayouts({homeHeroLayout:'invalid',homeCatalogLayout:123,homeFeaturedLayout:null}),defaults);
});
test('persist supported layout selections without changing other store content',()=>{
  const selected={homeHeroLayout:'immersive',homeCatalogLayout:'rail',homeFeaturedLayout:'static'};
  assert.deepEqual(normalizeHomepageLayouts({...selected,homeCatalogTitle:'Products'}),selected);
  assert.equal(normalizeHomepageLayouts({homeHeroLayout:'split',homeCatalogLayout:'editorial'}).homeCatalogLayout,'editorial');
});
