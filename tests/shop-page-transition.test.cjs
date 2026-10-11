const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
test('Shop transition animates content, preserves query, and restores it on route commit', async () => {
  const names = ['window', 'document', 'location', 'Element'];
  const saved = Object.fromEntries(names.map(name => [name, global[name]]));
  let click, pathname = '/', reduced = false, cursor = 0;
  const refs = [], animations = [], pushes = [];
  const main = { animate: (frames, options) => { const animation = { frames, options, finished: Promise.resolve(), cancelled: false, cancel() { this.cancelled = true; } }; animations.push(animation); return animation; } };
  const router = { prefetch() {}, push: (href, options) => pushes.push([href, options]) };
  const link = { href: 'https://store.test/products?category=tees', target: '', hasAttribute: () => false };
  class Target { closest() { return link; } }
  global.Element = Target;
  global.location = { href: 'https://store.test/', origin: 'https://store.test' };
  global.window = { matchMedia: () => ({ matches: reduced }), setTimeout: () => 1, clearTimeout() {} };
  global.document = { querySelector: () => main, addEventListener: (name, fn) => click = fn, removeEventListener() {} };
  try {
    const moduleObject = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync('src/components/ShopPageTransition.tsx', 'utf8'), { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const deps = { react: { useRef: initial => refs[cursor] || (refs[cursor++] = { current: initial }), useEffect: fn => fn() }, 'next/navigation': { usePathname: () => pathname, useRouter: () => router } };
    // Every render advances the ref cursor, including existing refs.
    deps.react.useRef = initial => { const index = cursor++; return refs[index] || (refs[index] = { current: initial }); };
    new Function('require', 'module', 'exports', code)(name => deps[name] || require(name), moduleObject, moduleObject.exports);
    const render = () => { cursor = 0; moduleObject.exports.ShopPageTransition(); };
    const event = extra => ({ defaultPrevented: false, button: 0, target: new Target(), preventDefault() { this.defaultPrevented = true; }, ...extra });
    render();
    const modified = event({ ctrlKey: true }); click(modified); assert.equal(modified.defaultPrevented, false);
    reduced = true; const normal = event(); click(normal); assert.equal(normal.defaultPrevented, false);
    reduced = false; const first = event(); click(first); click(event());
    await Promise.resolve();
    assert.equal(animations.length, 1);
    assert.equal(first.defaultPrevented, true);
    assert.deepEqual(pushes, [['/products?category=tees', { scroll: true }]]);
    pathname = '/products'; render();
    assert.equal(animations[0].cancelled, true);
    assert.equal(animations.length, 2);
    assert.equal(animations[1].frames.at(-1).opacity, 1);
    const current = event(); click(current); assert.equal(current.defaultPrevented, false);
  } finally { for (const name of names) global[name] = saved[name]; }
});
