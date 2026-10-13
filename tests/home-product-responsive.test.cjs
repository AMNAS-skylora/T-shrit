const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const grid = fs.readFileSync("src/components/HomeProductGrid.module.css", "utf8");
const card = fs.readFileSync("src/components/HomeProductGridCard.tsx", "utf8");
const section = fs.readFileSync("src/components/HomeAllProductsSection.tsx", "utf8");

test("product grid is two columns on phones and tablets, three on desktop", () => {
  assert.match(grid, /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  assert.match(grid, /@media\s*\(min-width:\s*1024px\)\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s);
  assert.match(grid, /\.grid\s*>\s*\*\s*\{[^}]*min-width:\s*0/s);
});

test("homepage keeps six real product cards and a separate all-products link", () => {
  assert.match(section, /products\.slice\(0,\s*6\)/);
  assert.match(section, /styles\.homeGrid/);
  assert.match(section, /visibleProducts\.map\(\(product\)/);
  assert.match(section, /<HomeProductGridCard/);
  assert.match(section, /href="\/products"/);
});

test("catalog cards stay readable on small phones and link directly to product detail", () => {
  assert.match(card, /aspect-\[4\/5\]/);
  assert.match(card, /\(max-width: 639px\) 46vw/);
  assert.match(card, /line-clamp-2/);
  assert.match(card, /flex-wrap items-baseline/);
  assert.match(card, /data-product-transition/);
  assert.match(card, /\/products\/\$\{product\.slug\}/);
  assert.doesNotMatch(card, /<OfferCountdown|getProductWhatsappUrl|home-product-whatsapp-button/);
});

test("show Limited offer only for an active discount with an end time", () => {
  assert.match(card, /const limitedOffer = available && discounted && Boolean\(product\.offerEndsAt\)/);
  assert.match(card, /Limited offer/);
  assert.match(card, /Sold out/);
  assert.match(card, /useOfferClock\(product, false\)/);
});

test("a filtered collection with only one product is centered, not stuck at the left", () => {
  assert.match(grid, /\.grid > :only-child\s*\{[^}]*grid-column: 1 \/ -1/s);
  assert.match(grid, /justify-self: center/);
});

test("mobile home preview keeps two even columns and balanced spacing for a 2 by 3 display", () => {
  assert.match(grid, /\.homeGrid\s*\{[^}]*align-content:\s*start/s);
  assert.match(grid, /@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*?\.homeGrid\s*\{[^}]*column-gap:\s*12px;[^}]*row-gap:\s*28px/s);
  assert.match(grid, /@media\s*\(max-width:\s*360px\)/);
  assert.match(grid, /grid-auto-flow:\s*row/);
});

test("mobile product card content fits two-column widths and aligns price to bottom", () => {
  assert.match(card, /aspect-\[4\/5\]/);
  assert.match(card, /line-clamp-2/);
  assert.match(card, /mt-auto flex min-w-0 flex-wrap items-baseline/);
  assert.match(card, /w-full min-w-0 flex-col/);
  assert.doesNotMatch(card, /<OfferCountdown|home-product-whatsapp-button/);
});
