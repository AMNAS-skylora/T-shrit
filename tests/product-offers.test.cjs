const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('src/lib/product-offers.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const result = { exports: {} };
new Function('module', 'exports', code)(result, result.exports);
const { getProductOfferErrors, getProductOfferCountdown, validateProductOffer, isProductOfferActive, getProductOfferPrice, getProductOfferStatus } = result.exports;
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
  for (const patch of [{offerValue:0},{offerValue:-2},{offerValue:101},{offerStartsAt:'invalid'},{offerEndsAt:product.offerStartsAt},{offerType:'fixed',offerValue:1100}]) {
    const invalid = {...product,...patch};
    assert.ok(validateProductOffer(invalid));
    assert.equal(isProductOfferActive(invalid,start),false);
  }
});
test('disabled offers preserve the original price', () => {
  assert.equal(validateProductOffer({...product,offerEnabled:false,offerValue:0}),null);
  assert.equal(getProductOfferPrice({...product,offerEnabled:false},start),1000);
});

test('legacy compare prices cannot activate a discount or countdown', () => {
  const legacy = {...product, offerEnabled:false, compareAtPrice:2000, saleEndsAt:product.offerEndsAt};
  assert.equal(isProductOfferActive(legacy,start),false);
  assert.equal(getProductOfferPrice(legacy,start),1000);
  assert.equal(getProductOfferCountdown(legacy,start),null);
});
test('timed offers count down days and seconds and disappear at expiry', () => {
  const timed = {...product, offerCountdown:false, offerEndsAt:new Date(start + 2*86400000).toISOString()};
  assert.equal(getProductOfferCountdown(timed,start),'2d 00h 00m 00s');
  assert.equal(getProductOfferCountdown(timed,start+1000),'1d 23h 59m 59s');
  assert.equal(getProductOfferCountdown(timed,start+2*86400000),null);
  assert.equal(getProductOfferCountdown(timed,start-1),null);
  assert.equal(validateProductOffer({...timed,offerEndsAt:undefined}),null);
});

test('offer must reduce the price, including after percentage rounding', () => {
  for (const patch of [{offerType:'sale-price',offerValue:1000},{offerType:'percentage',offerValue:0.001},{offerType:'unknown',offerValue:10}]) {
    assert.ok(validateProductOffer({...product,...patch}));
    assert.equal(getProductOfferPrice({...product,...patch},start),1000);
  }
});

test('undated offers stay active until disabled, with no countdown', () => {
  const undated = {...product,offerStartsAt:undefined,offerEndsAt:undefined,offerCountdown:true};
  assert.equal(validateProductOffer(undated),null);
  assert.equal(getProductOfferPrice(undated,start),800);
  assert.equal(getProductOfferPrice(undated,start+365*86400000),800);
  assert.equal(getProductOfferCountdown(undated,start),null);
  assert.equal(getProductOfferPrice({...undated,offerEnabled:false},start),1000);
});
test('field errors identify invalid discount and date inputs independently', () => {
  const errors = getProductOfferErrors({...product,offerValue:101,offerStartsAt:'bad',offerEndsAt:'also bad'});
  assert.match(errors.offerValue,/100%/);
  assert.match(errors.offerStartsAt,/start time/);
  assert.match(errors.offerEndsAt,/end time/);
  assert.deepEqual(getProductOfferErrors({...product,offerEnabled:false,offerValue:101}),{});
  assert.deepEqual(getProductOfferErrors({...product,offerStartsAt:undefined,offerEndsAt:undefined}),{});
});
