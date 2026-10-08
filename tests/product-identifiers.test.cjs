const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('src/lib/product-identifiers.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const result = { exports: {} };
new Function('module', 'exports', code)(result, result.exports);
const { getProductIdentifiers } = result.exports;
test('generate SKU and slug from the complete name when inputs are absent or blank', () => {
  assert.deepEqual(getProductIdentifiers('  Everyday Black Tee  ', {sku:' ',slug:''}, 'abc123'), {sku:'KLD-ABC123',slug:'everyday-black-tee-abc123'});
});
test('same-name products get distinct identifiers and non-Latin names get a valid URL', () => {
  const a = getProductIdentifiers('Tee', {}, 'first');
  const b = getProductIdentifiers('Tee', {}, 'second');
  assert.notEqual(a.sku,b.sku);
  assert.notEqual(a.slug,b.slug);
  assert.equal(getProductIdentifiers('ഷർട്ട്', {}, 'unique').slug, 'product-unique');
});
test('editing a name preserves published URLs and inventory references', () => {
  const current = {sku:'EXISTING-SKU',slug:'published-link'};
  assert.deepEqual(getProductIdentifiers('New name', {sku:'changed',slug:'changed'}, 'unused', current), current);
});
test('explicit import identifiers remain supported for existing CSV workflows', () => {
  assert.deepEqual(getProductIdentifiers('Tee', {sku:' custom-001 ',slug:'Imported Tee'}, 'unused'), {sku:'CUSTOM-001',slug:'imported-tee'});
});
