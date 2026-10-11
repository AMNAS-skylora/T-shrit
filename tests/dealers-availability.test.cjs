const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');

function load(path, enabled) {
  const module = { exports: {} };
  const missing = Object.assign(new Error('Not found'), { code: 'NOT_FOUND' });
  const code = ts.transpileModule(fs.readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  new Function('require', 'module', 'exports', code)(name => {
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'next/navigation') return { notFound: () => { throw missing; } };
    if (name === '@/lib/site-settings') return { getStoreSettings: async () => ({ homeDealersEnabled: enabled, whatsappNumber: '', supportEmail: '' }) };
    if (name === '@/lib/catalog') return { getCatalogProducts: async () => [], getWholesaleProductBySlug: async () => ({ name: 'Tee', status: 'active', wholesaleEnabled: true, stock: 1, colors: [] }) };
    if (name === '@/lib/dealer-products') return { getDealerProducts: rows => rows };
    if (name === '@/lib/format') return { getWholesaleWhatsappUrl: () => '#', getWholesaleProductWhatsappUrl: () => '#', formatPrice: () => '₹100' };
    if (name === '@/lib/product-images') return { getProductPrimaryImage: () => '' };
    return new Proxy({ default: {} }, { get: (target, key) => key in target ? target[key] : () => null });
  }, module, module.exports);
  return module.exports;
}

test('disabled Dealers blocks catalog, product page and product metadata for direct URLs', async () => {
  const catalog = load('src/app/wholesale/page.tsx', false);
  const detail = load('src/app/wholesale/[slug]/page.tsx', false);
  const args = { params: Promise.resolve({ slug: 'tee' }) };
  for (const call of [() => catalog.default(), () => detail.default(args), () => detail.generateMetadata(args)]) {
    await assert.rejects(call, { code: 'NOT_FOUND' });
  }
});
test('enabled Dealers permits catalog, product page and product metadata', async () => {
  const catalog = load('src/app/wholesale/page.tsx', true);
  const detail = load('src/app/wholesale/[slug]/page.tsx', true);
  const args = { params: Promise.resolve({ slug: 'tee' }) };
  assert.ok(await catalog.default());
  assert.ok(await detail.default(args));
  assert.equal((await detail.generateMetadata(args)).title, 'Tee — Dealers');
});
