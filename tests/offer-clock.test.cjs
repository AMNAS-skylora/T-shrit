const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
function load(path, dependencies = {}) {
  const result = {exports:{}};
  const code = ts.transpileModule(fs.readFileSync(path,'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  new Function('require','module','exports',code)(name=>dependencies[name] || require(name),result,result.exports);
  return result.exports;
}
const provider = load('src/components/OfferClockProvider.tsx');
const {useOfferClock} = load('src/hooks/useOfferClock.ts',{'@/components/OfferClockProvider':provider});
const offers = load('src/lib/product-offers.ts');
const start = Date.parse('2026-10-11T00:00:00Z');
const product = {price:500,offerEnabled:true,offerType:'fixed',offerValue:100,offerStartsAt:new Date(start).toISOString(),offerEndsAt:new Date(start+86400000).toISOString()};
function PriceAndTimer() {
  const now = useOfferClock(product);
  return React.createElement('p',null,`${offers.getProductOfferPrice(product,now)} / ${offers.getProductOfferCountdown(product,now)}`);
}
test('server and first browser render share the serialized time even across offer expiry', () => {
  const original = Date.now;
  try {
    Date.now = () => start + 1000;
    const render = () => renderToStaticMarkup(React.createElement(provider.OfferClockProvider,{initialNow:start+1000},React.createElement(PriceAndTimer)));
    const server = render();
    Date.now = () => start + 86400001;
    assert.equal(render(),server);
    assert.match(server,/400 \/ 0d 23h 59m 59s/);
  } finally { Date.now = original; }
});
test('after hydration the clock ticks, wakes at expiry, and cleans up listeners', () => {
  let effect, state, delay, callback, cleared = 0;
  const events = new Map();
  const original = {now:Date.now,window:global.window,document:global.document};
  try {
    Date.now = () => start + 500;
    global.window = {clearTimeout:()=>cleared++,setTimeout:(fn,ms)=>{callback=fn;delay=ms;return 1;},addEventListener:(n,f)=>events.set(n,f),removeEventListener:n=>events.delete(n)};
    global.document = {hidden:false,addEventListener:(n,f)=>events.set(n,f),removeEventListener:n=>events.delete(n)};
    const hook = load('src/hooks/useOfferClock.ts',{
      react:{useState:initial=>[initial,value=>state=value],useEffect:fn=>effect=fn},
      '@/components/OfferClockProvider':{useInitialOfferTime:()=>start},
    }).useOfferClock;
    const timed = {...product,offerEndsAt:new Date(start+1000).toISOString()};
    assert.equal(hook(timed),start);
    const cleanup = effect();
    assert.equal(state,start+500);
    assert.equal(delay,500);
    Date.now = () => start+1000;
    callback();
    assert.equal(offers.getProductOfferPrice(timed,state),500);
    assert.equal(offers.getProductOfferCountdown(timed,state),null);
    cleanup();
    assert.ok(cleared>0);
    assert.equal(events.size,0);
  } finally {
    Date.now=original.now;global.window=original.window;global.document=original.document;
  }
});
