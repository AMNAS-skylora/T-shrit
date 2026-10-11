const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(deps) {
  const moduleObject = { exports: {} };
  const source = fs.readFileSync('src/components/ProductImageTransition.tsx', 'utf8') + '\nexport { getCenteredRect };';
  const code = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  new Function('require', 'module', 'exports', code)(name => deps[name] || require(name), moduleObject, moduleObject.exports);
  return moduleObject.exports;
}
test('narrow three-column mobile cards retain their aspect ratio at the center', () => {
  const previous = global.window;
  global.window = { innerWidth: 360, innerHeight: 700 };
  try {
    const component = load({ react: {}, 'next/navigation': {} });
    for (const source of [{ width: 104, height: 130 }, { width: 90, height: 180 }]) {
      const rect = component.getCenteredRect(source);
      assert.ok(Math.abs(rect.width / rect.height - source.width / source.height) < .0001);
      assert.equal(rect.left + rect.width / 2, 180);
      assert.equal(rect.top + rect.height / 2, 350);
      assert.ok(rect.width < source.width);
    }
  } finally { global.window = previous; }
});
test('click transition uses transform keyframes and keeps navigation query; reduced motion uses normal links', async () => {
  const saved = Object.fromEntries(['window', 'document', 'location', 'getComputedStyle'].map(name => [name, global[name]]));
  let click; let reduced = false; let created = 0; const pushes = []; const frames = [];
  const router = { prefetch: () => {}, push: href => pushes.push(href) };
  const source = { complete: true, naturalWidth: 800, currentSrc: '/tee.png', animate: () => {}, getBoundingClientRect: () => ({ left: 16, top: 100, width: 104, height: 130 }) };
  const link = { target: '', href: 'https://store.test/products/tee?size=M', hasAttribute: () => false, querySelector: () => source };
  global.window = { innerWidth: 360, innerHeight: 700, matchMedia: () => ({ matches: reduced }), setTimeout: () => 1, clearTimeout: () => {} };
  global.location = { href: 'https://store.test/', origin: 'https://store.test' };
  global.getComputedStyle = () => ({ objectFit: 'contain', objectPosition: 'center', borderRadius: '0px', padding: '6px' });
  global.document = { documentElement: { dataset: {} }, body: { append: () => {} }, addEventListener: (name, handler) => { if (name === 'click') click = handler; }, removeEventListener: () => {}, createElement: () => { created++; return { style: {}, setAttribute: () => {}, remove: () => {}, animate: keyframes => { frames.push(keyframes); return { finished: Promise.resolve(), cancel: () => {} }; } }; } };
  try {
    const component = load({ react: { useRef: () => ({ current: null }), useEffect: effect => effect() }, 'next/navigation': { usePathname: () => '/', useRouter: () => router } });
    component.ProductImageTransition();
    let prevented = false;
    const event = () => ({ button: 0, target: { closest: () => link }, preventDefault: () => prevented = true, stopPropagation: () => {} });
    reduced = true; click(event()); assert.equal(prevented, false); assert.equal(created, 0);
    reduced = false; click(event()); await Promise.resolve(); await Promise.resolve();
    assert.equal(prevented, true);
    assert.deepEqual(pushes, ['/products/tee?size=M']);
    assert.ok(frames[1].every(frame => 'transform' in frame && !('width' in frame) && !('left' in frame)));
  } finally { for (const [name, value] of Object.entries(saved)) global[name] = value; }
});
