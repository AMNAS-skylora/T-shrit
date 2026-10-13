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
const { homeAbout } = load('src/data/home-about.ts');
const { HomeAboutSection } = load('src/components/HomeAboutSection.tsx', {
  '@/data/home-about': { homeAbout },
  '@/components/AboutHangerImage': { AboutHangerImage: () => React.createElement('img', { src: '/images/about/tshirts-hanger.png', alt: 'T-shirts on hangers' }) },
  './HomeAboutSection.module.css': { default: { section: 'section' } },
  'next/link': { default: props => React.createElement('a', props, props.children) },
});
test('About renders permanent copy, local hanger image and product link', () => {
  const html = renderToStaticMarkup(React.createElement(HomeAboutSection));
  assert.match(html, /ABOUT KLEID.IN/); assert.match(html, /EVERYDAY COMFORT/);
  assert.match(html, /src="\/images\/about\/tshirts-hanger.png"/);
  assert.match(html, /href="\/products"/);
});

const styles = fs.readFileSync('src/components/HomeAboutSection.module.css','utf8');
const aboutMarkup = fs.readFileSync('src/components/HomeAboutSection.tsx','utf8');

test('mobile About image is fully contained, with no crop or gradient mask', () => {
  assert.match(styles, /@media \(max-width: 800px\)/);
  assert.match(styles, /object-fit:\s*contain/);
  assert.match(styles, /object-position:\s*center bottom/);
  assert.match(styles, /mask-image:\s*none/);
  assert.match(styles, /height:\s*clamp\(220px, 75vw, 320px\)/);
});

test('About mobile layout stacks content and displays feature points as readable rows', () => {
  assert.match(styles, /grid-template-columns:\s*minmax\(0, 1fr\)/);
  assert.match(styles, /\.points\s*\{\s*display:\s*grid/);
  assert.match(styles, /\.points li\s*\{[^}]*min-height:\s*43px/s);
  assert.match(styles, /\.link\s*\{\s*width:\s*100%/);
  assert.match(aboutMarkup, /className=\{styles\.pointIndex\}/);
  const html = renderToStaticMarkup(React.createElement(HomeAboutSection));
  for (const point of homeAbout.points) assert.match(html, new RegExp(point.title.replace('&', '&amp;')));
  assert.match(html, /01/);
  assert.match(html, /03/);
});

const hanger = fs.readFileSync('src/components/AboutHangerImage.tsx', 'utf8');

test('About hanger rail and T-shirts enter horizontally from outside while scrolling', () => {
  assert.match(hanger, /requestAnimationFrame\(update\)/);
  assert.match(hanger, /addEventListener\("scroll", schedule, \{ passive: true \}\)/);
  assert.match(hanger, /getBoundingClientRect\(\)/);
  assert.match(hanger, /--hanger-enter-x/);
  assert.match(hanger, /bounds\.width \+ Math\.min\(viewportHeight \* 0\.08, 64\)/);
  assert.match(hanger, /offset = -outsideDistance \* \(1 - eased\)/);
  assert.match(styles, /transform: translate3d\(var\(--hanger-enter-x, 0px\), 0, 0\)/);
  assert.doesNotMatch(hanger, /--about-scroll-y/);
  assert.doesNotMatch(styles, /--about-scroll-y/);
});

test('horizontal rail entrance works on mobile and cleans up without moving copy', () => {
  assert.match(hanger, /window\.cancelAnimationFrame\(frame\)/);
  assert.match(hanger, /window\.removeEventListener\("scroll", schedule\)/);
  assert.match(hanger, /prefers-reduced-motion: reduce/);
  assert.match(styles, /overflow: hidden/);
  assert.match(styles, /padding: 24px clamp\(8px, 2vw, 18px\)/);
  assert.match(styles, /object-fit: contain/);
  assert.match(styles, /\.visual img \{ transform: none; will-change: auto; \}/);
});
