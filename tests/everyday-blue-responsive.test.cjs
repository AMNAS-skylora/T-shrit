const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");

const css = fs.readFileSync("src/components/HomeDealersSection.module.css", "utf8");
const source = fs.readFileSync("src/components/HomeDealersSection.tsx", "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const moduleRef = { exports: {} };
new Function("require", "module", "exports", compiled)((name) => {
  if (name === "react/jsx-runtime") return require(name);
  if (name === "next/link") return { default: (props) => React.createElement("a", props, props.children) };
  if (name === "@/lib/dealer-products") return { getDealerProducts: () => [{ id: "item" }] };
  if (name === "@/lib/format") return { getWholesaleWhatsappUrl: () => "#" };
  if (name === "./HomeDealersSection.module.css") {
    return { default: new Proxy({}, { get: (_, key) => String(key) }) };
  }
  return require(name);
}, moduleRef, moduleRef.exports);
const { HomeDealersSection } = moduleRef.exports;

test("Everyday fallback shows three numbered features with unchanged copy", () => {
  const html = renderToStaticMarkup(React.createElement(HomeDealersSection, {
    enabled: false, products: [], whatsappNumber: "",
  }));
  assert.match(html, /id="everyday-style"/);
  assert.match(html, /class="section everydayBlue"/);
  for (const title of ["Wear it your way", "Find your colour", "Choose your fit"]) {
    assert.ok(html.includes(title));
  }
  for (const n of ["01", "02", "03"]) assert.ok(html.includes(">" + n + "</span>"));
  assert.match(html, /Your own style/);
});

test("Everyday design includes phone/tablet-specific layout and accessible text spacing", () => {
  assert.match(css, /\.everydayBlue \{\s*padding: 52px clamp\(22px, 6vw, 44px\) 62px;/);
  assert.match(css, /\.everydayBlue \.layout \{\s*max-width: 600px;\s*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(css, /\.everydayFeature \{[\s\S]*border-top: 1px solid rgba\(255, 255, 255, \.25\)/);
  assert.match(css, /@media \(max-width: 380px\)/);
  assert.match(css, /\.everydayBlue \.featureCopy p/);
});

test("Dealer-enabled mode remains available independently", () => {
  const html = renderToStaticMarkup(React.createElement(HomeDealersSection, {
    enabled: true, products: [], whatsappNumber: "",
  }));
  assert.match(html, /id="dealers"/);
  assert.doesNotMatch(html, /id="everyday-style"/);
  assert.ok(source.includes('className={styles.section}'));
});
