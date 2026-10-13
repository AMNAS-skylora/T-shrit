const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const component = fs.readFileSync("src/components/FeaturedProductMotion.tsx", "utf8");
const styles = fs.readFileSync("src/components/FeaturedProductMotion.module.css", "utf8");

test("featured product title, description, prices, countdown and CTA remain present", () => {
  assert.match(component, /\{current\.name\}/);
  assert.match(component, /\{current\.description\}/);
  assert.match(component, /formatPrice\(offerPrice\)/);
  assert.match(component, /isProductOfferActive\(current, now\)/);
  assert.match(component, /<OfferCountdown product=\{current\} now=\{now\}/);
  assert.match(component, /View product/);
  assert.match(component, /href=\{"\/products\/" \+ current\.slug\}/);
});

test("mobile image first and full-width CTA have adequate tap height", () => {
  assert.match(styles, /@media \(max-width: 800px\)/);
  assert.match(styles, /\.media\s*\{\s*order:\s*-1;/);
  assert.match(styles, /\.button\s*\{[^}]*width:\s*100%/s);
  assert.match(styles, /\.button\s*\{[^}]*min-height:\s*50px/s);
});

test("countdown is styled only inside featured section as four equal cells", () => {
  assert.match(styles, /\.countdown :global\(\[role="timer"\]\) > div\s*\{/);
  assert.match(styles, /grid-template-columns:\s*repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /\.countdown :global\(\[role="timer"\]\) > div > span > small/);
  assert.match(styles, /@media \(max-width: 380px\)/);
});
