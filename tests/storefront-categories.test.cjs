const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

const moduleSource = fs.readFileSync("src/lib/storefront-categories.ts", "utf8");
const output = ts.transpileModule(moduleSource, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const moduleRef = { exports: {} };
new Function("require", "module", "exports", output)(require, moduleRef, moduleRef.exports);

const { getStorefrontCategories, getCategoryShopHref, productMatchesCategory } = moduleRef.exports;

test("category strip uses real saved and active-product categories without case duplicates", () => {
  const categories = getStorefrontCategories(
    [
      { category: " Shirts ", status: "active" },
      { category: "t-shirts", status: "active" },
      { category: "Hidden", status: "draft" },
      { category: "SHIRTS", status: "active" },
      { category: " ", status: "active" },
    ],
    ["T-Shirts", "Oversized Fits", "shirts", "  "],
  );
  assert.deepEqual(categories, ["Oversized Fits", "Shirts", "T-Shirts"]);
});

test("category links preserve punctuation and unicode as URL query parameters", () => {
  const category = "T-Shirts & Hoodies / മലയാളം";
  const url = getCategoryShopHref(category);
  assert.equal(url, "/products?category=" + encodeURIComponent(category));
  assert.equal(new URL(url, "https://kleid.in").searchParams.get("category"), category);
});

test("product filter matches category links regardless of letter case and whitespace", () => {
  assert.equal(productMatchesCategory(" T-Shirts ", "t-shirts"), true);
  assert.equal(productMatchesCategory("Shirts", "T-Shirts"), false);
  assert.equal(productMatchesCategory("Shirts", "All"), true);
});

test("category strip and shop both connect to category query navigation", () => {
  const marquee = fs.readFileSync("src/components/HomeCategoryMarquee.tsx", "utf8");
  const shop = fs.readFileSync("src/app/products/page.tsx", "utf8");
  const catalog = fs.readFileSync("src/components/HomeProductCatalog.tsx", "utf8");
  assert.match(marquee, /getCategoryShopHref\(category\)/);
  assert.match(shop, /initialCategory=\{selectedCategory\}/);
  assert.match(catalog, /productMatchesCategory\(product\.category, category\)/);
});
