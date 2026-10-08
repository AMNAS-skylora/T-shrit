const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const result = { exports: {} };
const code = ts.transpileModule(fs.readFileSync('src/lib/hero-swipe.ts','utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
new Function('module','exports',code)(result,result.exports);
const { getHeroSwipeDirection } = result.exports;
test('horizontal swipes navigate while taps and page scrolling leave the slide unchanged', () => {
  const start = { x: 200, y: 200 };
  assert.equal(getHeroSwipeDirection(start, { x: 100, y: 210 }), 1);
  assert.equal(getHeroSwipeDirection(start, { x: 300, y: 210 }), -1);
  assert.equal(getHeroSwipeDirection(start, { x: 190, y: 200 }), 0);
  assert.equal(getHeroSwipeDirection(start, { x: 140, y: 350 }), 0);
  assert.equal(getHeroSwipeDirection(start, { x: 140, y: 260 }), 0);
});
