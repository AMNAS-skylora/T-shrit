const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
function load(path, dependencies = {}) {
  const result = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'module', 'exports', code)(name => dependencies[name] || require(name), result, result.exports);
  return result.exports;
}
const offers = load('src/lib/product-offers.ts');
const countdown = load('src/components/OfferCountdown.tsx', {
  '@/lib/product-offers': offers,
  './OfferCountdown.module.css': {default:{}},
});
const now = Date.parse('2026-10-11T00:00:00Z');
const dependencies = {
  '@/components/OfferCountdown': countdown,
  '@/lib/product-offers': offers,
  '@/hooks/useOfferClock': { useOfferClock: () => now },
  '@/lib/format': {formatPrice: price => `INR${price}`, getProductWhatsappUrl: () => '#'},
  '@/lib/product-images': {getProductImageForColor: () => '', getProductPrimaryImage: () => ''},
  '@/components/StoreSettingsContext': {useStoreSettings: () => ({whatsappNumber:''})},
  'next/link': {default: ({children, ...props}) => React.createElement('a',props,children)},
  'next/image': {default: () => null},
};
const {ProductCard} = load('src/components/ProductCard.tsx',dependencies);
const {HomeProductGridCard} = load('src/components/HomeProductGridCard.tsx',dependencies);
const product = {name:'Tee',slug:'tee',price:500,compareAtPrice:900,colors:[],sizes:[],stock:20,status:'active',category:'T-shirts',saleLabel:'Legacy sale',saleEndsAt:new Date(now+86400000).toISOString()};
for (const Component of [ProductCard,HomeProductGridCard]) {
  test(`${Component.name} hides legacy discounts while offers are off and restores full price on expiry`, () => {
    for (const patch of [{offerEnabled:false},{offerEnabled:true,offerType:'fixed',offerValue:100,offerEndsAt:new Date(now).toISOString()}]) {
      const html = renderToStaticMarkup(React.createElement(Component,{product:{...product,...patch},whatsappNumber:''}));
      assert.match(html,/INR500/);
      assert.doesNotMatch(html,/<del|INR900|INR400|Legacy sale|Offer ends|ENDS /);
    }
    const html = renderToStaticMarkup(React.createElement(Component,{product:{...product,offerEnabled:true,offerType:'fixed',offerValue:100,offerEndsAt:new Date(now+86400000).toISOString()},whatsappNumber:''}));
    assert.match(html,/INR400/);
    if (Component === ProductCard) assert.match(html, /1d 00h 00m 00s/);
    else {
      assert.match(html, /Limited offer/);
      assert.doesNotMatch(html, /1d 00h 00m 00s|WhatsApp|<button/);
    }
  });
}

test("catalog card shows no Limited offer badge for an open-ended discount", () => {
  const html = renderToStaticMarkup(React.createElement(HomeProductGridCard, {
    product: { ...product, offerEnabled: true, offerType: "fixed", offerValue: 100, offerEndsAt: undefined },
    whatsappNumber: "",
  }));
  assert.match(html, /INR400/);
  assert.doesNotMatch(html, /Limited offer|Offer ends|<button/);
});

test("sold-out catalog card has no limited offer badge or sold-out button", () => {
  const html = renderToStaticMarkup(React.createElement(HomeProductGridCard, {
    product: { ...product, stock: 0, offerEnabled: true, offerType: "fixed", offerValue: 100,
      offerEndsAt: new Date(now + 86400000).toISOString() },
    whatsappNumber: "",
  }));
  assert.match(html, /Sold out/);
  assert.doesNotMatch(html, /Limited offer|<button/);
});
