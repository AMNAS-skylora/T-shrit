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
