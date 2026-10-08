const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('src/lib/product-offers.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const result = { exports: {} };
new Function('module', 'exports', code)(result, result.exports);
const { validateProductOffer, isProductOfferActive, getProductOfferPrice, getProductOfferStatus } = result.exports;
const start = Date.parse('2026-10-08T10:00:00Z');
const end = start + 3600000;
const product = { price: 1000, offerEnabled: true, offerType: 'percentage', offerValue: 20, offerStartsAt: new Date(start).toISOString(), offerEndsAt: new Date(end).toISOString() };
test('scheduled offer starts inclusively and expires at the end boundary', () => {
  assert.equal(getProductOfferStatus(product, start - 1), 'scheduled');
  assert.equal(getProductOfferPrice(product, start - 1), 1000);
  assert.equal(getProductOfferPrice(product, start), 800);
  assert.equal(isProductOfferActive(product, end - 1), true);
  assert.equal(getProductOfferStatus(product, end), 'expired');
  assert.equal(getProductOfferPrice(product, end), 1000);
});
test('all discount types calculate expected prices', () => {
  assert.equal(getProductOfferPrice({...product, offerType:'fixed', offerValue:150}, start),850);
  assert.equal(getProductOfferPrice({...product, offerType:'sale-price', offerValue:650}, start),650);
});
test('reject malformed dates, backwards ranges and invalid values', () => {
  for (const patch of [{offerValue:0},{offerValue:-2},{offerValue:101},{offerStartsAt:'invalid'},{offerEndsAt:product.offerStartsAt},{offerType:'fixed',offerValue:1100},{offerCountdown:true,offerEndsAt:undefined}]) {
    const invalid = {...product,...patch};
    assert.ok(validateProductOffer(invalid));
    assert.equal(isProductOfferActive(invalid,start),false);
  }
});
test('disabled offers preserve the original price', () => {
  assert.equal(validateProductOffer({...product,offerEnabled:false,offerValue:0}),null);
  assert.equal(getProductOfferPrice({...product,offerEnabled:false},start),1000);
});
