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
