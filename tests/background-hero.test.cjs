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
const { normalizeHeroImageOpacity } = load('src/lib/hero-image-placement.ts');
test('background opacity defaults low, accepts invisible/fully visible images and bounds unsafe values', () => {
  assert.equal(normalizeHeroImageOpacity(undefined), 40); assert.equal(normalizeHeroImageOpacity(NaN), 40);
  assert.equal(normalizeHeroImageOpacity(-100), 0); assert.equal(normalizeHeroImageOpacity(150), 100);
  assert.equal(normalizeHeroImageOpacity(0), 0); assert.equal(normalizeHeroImageOpacity(100), 100);
});
test('opacity is applied only to the image, with readable text and real configured button links above it', () => {
  const { BackgroundHero } = load('src/components/BackgroundHero.tsx', {
    'next/link': { default: props => React.createElement('a', props, props.children) },
    './BackgroundHero.module.css': { default: { hero: 'hero', background: 'background', copy: 'copy' } },
  });
  const slide = { title: 'Custom title', subtitle: 'Custom description', imageUrl: '/photo.png', imageOpacity: 25, imagePlacement: { desktop: { scale: 100 }, mobile: { scale: 80 } }, button: 'Shop', href: '/products', secondaryButton: 'Contact', secondaryHref: '/contact' };
  const html = renderToStaticMarkup(React.createElement(BackgroundHero, { slide }));
  assert.match(html, /<img[^>]+style="opacity:0.25;/);
  assert.doesNotMatch(html, /<section[^>]+opacity/);
  assert.match(html, /Custom title/); assert.match(html, /Custom description/); assert.match(html, /href="\/contact"/);
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(BackgroundHero, { slide: { ...slide, secondaryButton: '' } })), /href="\/contact"/);
});
