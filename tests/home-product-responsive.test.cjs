const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const grid = fs.readFileSync("src/components/HomeProductGrid.module.css", "utf8");
const card = fs.readFileSync("src/components/HomeProductGridCard.tsx", "utf8");
const cardStyles = fs.readFileSync("src/components/HomeProductGridCard.module.css", "utf8");
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

test("premium catalog cards remain readable and clickable on small phones", () => {
  assert.match(cardStyles, /aspect-ratio:\s*4 \/ 5/);
  assert.match(card, /\(max-width: 639px\) 46vw/);
  assert.match(cardStyles, /-webkit-line-clamp:\s*2/);
  assert.match(cardStyles, /align-items:\s*baseline/);
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

test("one real product stays in the leftmost grid column instead of spanning or centering", () => {
  assert.doesNotMatch(grid, /\.grid\s*>\s*:only-child/);
  assert.doesNotMatch(grid, /grid-column:\s*1\s*\/\s*-1/);
  assert.doesNotMatch(grid, /justify-self:\s*center/);
  assert.match(grid, /\.grid\s*>\s*\*\s*\{[^}]*grid-column:\s*auto/s);
  assert.match(grid, /\.grid\s*>\s*\*\s*\{[^}]*width:\s*100%/s);
  assert.match(grid, /justify-items:\s*stretch/);
});

test("mobile home preview keeps two even columns and balanced spacing for a 2 by 3 display", () => {
  assert.match(grid, /\.homeGrid\s*\{[^}]*align-content:\s*start/s);
  assert.match(grid, /@media\s*\(max-width:\s*640px\)\s*\{[\s\S]*?\.homeGrid\s*\{[^}]*column-gap:\s*12px;[^}]*row-gap:\s*28px/s);
  assert.match(grid, /@media\s*\(max-width:\s*360px\)/);
  assert.match(grid, /grid-auto-flow:\s*row/);
});

test("mobile card has a unified bordered surface, left-aligned copy and a bottom-aligned price", () => {
  assert.match(card, /className=\{styles\.card/);
  assert.match(card, /className=\{styles\.media\}/);
  assert.match(card, /className=\{styles\.content\}/);
  assert.match(cardStyles, /aspect-ratio:\s*4 \/ 5/);
  assert.match(cardStyles, /margin-top:\s*auto/);
  assert.match(cardStyles, /text-align:\s*left/);
  assert.match(cardStyles, /@media \(max-width: 640px\)/);
  assert.match(cardStyles, /border: 1px solid #e5e5e2/);
  assert.doesNotMatch(card, /<OfferCountdown|home-product-whatsapp-button/);
});

test("limited-time offer stays a compact badge, never an added product tile or countdown", () => {
  assert.match(card, /const limitedOffer = available && discounted && Boolean\(product\.offerEndsAt\)/);
  assert.match(card, /className=\{styles\.badge \+ " " \+ styles\.badgeOffer\}/);
  assert.doesNotMatch(card, /<OfferCountdown/);
  assert.match(section, /products\.slice\(0, 6\)/);
});

test("active timed offer has a red lower-left image badge on mobile and desktop", () => {
  const offerRule = cardStyles.match(/\.badgeOffer\s*\{([^}]+)\}/)?.[1] ?? "";
  assert.match(offerRule, /top:\s*auto/);
  assert.match(offerRule, /bottom:\s*10px/);
  assert.match(offerRule, /left:\s*10px/);
  assert.match(offerRule, /background:\s*#d92d20/);
  assert.match(offerRule, /color:\s*#fff/);
  const mobile = cardStyles.match(/@media \(max-width: 640px\)\s*\{([\s\S]*?)\n\}\n\n@media \(max-width: 360px\)/)?.[1] ?? "";
  assert.match(mobile, /\.badgeOffer\s*\{\s*top:\s*auto;\s*bottom:\s*8px/);
  assert.match(card, /const limitedOffer = available && discounted && Boolean\(product\.offerEndsAt\)/);
  assert.match(card, /Limited offer/);
});
