const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

test('spotlight colour and size buttons update order selection and selected variant availability', () => {
  let cursor = 0;
  const state = [];
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('src/components/ProductActions.tsx', 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const deps = {
    react: { useState: initial => { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], value => state[index] = value]; } },
    '@/hooks/useOfferClock': { useOfferClock: () => 0 },
    '@/components/StoreSettingsContext': { useStoreSettings: () => ({ whatsappNumber: '123' }) },
    '@/lib/format': { getProductWhatsappUrl: (product, number, color, size) => `https://wa.me/${number}?color=${color}&size=${size}` },
  };
  new Function('require', 'module', 'exports', code)(name => deps[name] || require(name), module, module.exports);
  const product = { status: 'active', stock: 10, sizes: ['S', 'M'], colors: ['Red', 'Blue'], colorVariants: [
    { name: 'Red', value: '#ff0000', stock: 5 },
    { name: 'Blue', value: '#0000ff', stock: 4, sizeStocks: { S: 0, M: 4 } },
  ] };
  let selectedColor;
  const render = () => { cursor = 0; return module.exports.ProductActions({ product, showColorOptions: true, onColorChange: color => selectedColor = color }); };
  const nodes = tree => { const result = []; const walk = value => { if (Array.isArray(value)) value.forEach(walk); else if (value && typeof value === 'object' && value.props) { result.push(value); walk(value.props.children); } }; walk(tree); return result; };
  let tree = nodes(render());
  assert.match(tree.find(node => node.type === 'a').props.href, /color=Red&size=S/);
  tree.find(node => node.type === 'button' && node.key === 'Blue').props.onClick();
  assert.equal(selectedColor, 'Blue');
  tree = nodes(render());
  assert.equal(tree.find(node => node.type === 'button' && node.key === 'Blue').props['aria-pressed'], true);
  assert.ok(tree.find(node => node.type === 'button' && node.props.disabled));
  tree.find(node => node.type === 'button' && node.key === 'M').props.onClick();
  tree = nodes(render());
  assert.match(tree.find(node => node.type === 'a').props.href, /color=Blue&size=M/);
  assert.equal(tree.find(node => node.type === 'button' && node.key === 'M').props['aria-pressed'], true);
});
