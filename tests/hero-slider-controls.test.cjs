const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
function load(path, deps) {
 const module = { exports: {} };
 const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
 new Function('require','module','exports',code)(name => deps[name] ?? require(name), module, module.exports);
 return module.exports;
}
const swipe = load('src/lib/hero-swipe.ts', {});
function setup() {
 const changes = []; const effects = []; let stateIndex = 0;
 const mockReact = { useState: value => { const key = stateIndex++; return [value, next => changes.push([key, next])]; }, useRef: () => ({ current: null }), useMemo: fn => fn(), useEffect: fn => effects.push(fn), useLayoutEffect: () => {} };
 const { HomeHeroSlider } = load('src/components/HomeHeroSlider.tsx', {
  react: mockReact, '@/lib/hero-swipe': swipe,
  '@/lib/comfort-slides': { getComfortSlides: () => [{ id: 'first' }, { id: 'second' }] },
  '@/components/BackgroundHero': { BackgroundHero: () => null }, '@/components/SecondaryHero': { SecondaryHero: () => null }, '@/components/ComfortHero': { ComfortHero: () => null },
  './ComfortHero.module.css': { default: { slider: 'slider', draggable: 'draggable' } },
 });
 return { element: HomeHeroSlider({ settings: {}, products: [], slides: [], initialNow: 0 }), changes, effects };
}
test('Hero has no visible navigation controls and supports mouse drag and keyboard navigation', () => {
 const { element, changes } = setup();
 const target = { closest: () => null, setPointerCapture: () => {}, hasPointerCapture: () => true, releasePointerCapture: () => {} };
 element.props.onPointerDown({ pointerType: 'mouse', button: 0, clientX: 150, clientY: 50, target, currentTarget: target, pointerId: 1 });
 element.props.onPointerUp({ pointerType: 'mouse', clientX: 50, clientY: 50, currentTarget: target, pointerId: 1 });
 assert.ok(changes.some(([key,value]) => key === 1 && value === 'second'));
 changes.length = 0;
 element.props.onKeyDown({ key: 'ArrowRight', target, currentTarget: target, preventDefault() {} });
 assert.ok(changes.some(([key,value]) => key === 1 && value === 'second'));
 assert.equal(element.props.tabIndex, 0);
 assert.ok([element.props.children].flat().filter(Boolean).every(child => child.type !== 'button' && child.props?.role !== 'group'));
});
test('Hero still automatically advances after five seconds and cleans up its timer', () => {
 const { changes, effects } = setup();
 const original = global.window; let tick, delay, cleared;
 global.window = { setTimeout: (fn, ms) => { tick = fn; delay = ms; return 7; }, clearTimeout: id => { cleared = id; } };
 try { const cleanup = effects.at(-1)(); assert.equal(delay, 5000); tick(); assert.ok(changes.some(([key,value]) => key === 1 && value === 'second')); cleanup(); assert.equal(cleared, 7); }
 finally { global.window = original; }
});
