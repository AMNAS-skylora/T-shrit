const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function setup(used = []) {
  const rows = new Map();
  const collection = {
    find: () => ({ toArray: async () => [...rows.values()] }),
    distinct: async () => used,
    updateOne: async ({ _id }, update) => { if (!rows.has(_id)) rows.set(_id, { _id, ...update.$setOnInsert }); },
    findOne: async ({ _id }) => rows.get(_id),
  };
  const db = { collection: () => collection };
  const result = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('src/lib/mongodb-categories.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('require', 'module', 'exports', code)((name) => name === 'server-only' ? {} : { getDb: async () => db }, result, result.exports);
  return result.exports;
}
test('categories persist before products are created and duplicate case/spacing reuses the name', async () => {
  const {addCategory,listCategories} = setup();
  assert.equal(await addCategory('  T  Shirts  '), 'T Shirts');
  assert.equal(await addCategory('t shirts'), 'T Shirts');
  assert.deepEqual(await listCategories(), ['T Shirts']);
});
test('dropdown includes existing product categories without case duplicates or blanks', async () => {
  const {addCategory,listCategories} = setup([' T Shirts ', 't shirts', '', null, 'Pants']);
  await addCategory('T Shirts');
  assert.deepEqual(await listCategories(), ['Pants','T Shirts']);
});
test('reject blank, non-string and oversized category names', async () => {
  const {addCategory} = setup();
  for (const name of ['', ' ', 123, 'a'.repeat(81)]) await assert.rejects(addCategory(name));
});
