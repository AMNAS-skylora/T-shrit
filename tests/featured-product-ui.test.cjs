const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const component = fs.readFileSync("src/components/FeaturedProductMotion.tsx", "utf8");
const styles = fs.readFileSync("src/components/FeaturedProductMotion.module.css", "utf8");
const gridCard = fs.readFileSync("src/components/HomeProductGridCard.tsx", "utf8");
const spotlight = fs.readFileSync("src/components/HomeSpotlightSection.tsx", "utf8");

test("featured product keeps title, description, price and product CTA", () => {
  assert.match(component, /\{current\.name\}/);
  assert.match(component, /\{current\.description\}/);
  assert.match(component, /formatPrice\(offerPrice\)/);
  assert.match(component, /isProductOfferActive\(current, now\)/);
  assert.match(component, /View product/);
  assert.match(component, /href=\{"\/products\/" \+ current\.slug\}/);
});

test("featured section omits category eyebrow and offer countdown, other product timers remain", () => {
  assert.doesNotMatch(component, /KLEID\.IN \/ \{current\.category/);
  assert.doesNotMatch(component, /OfferCountdown/);
  assert.doesNotMatch(component, /styles\.countdown|styles\.eyebrow/);
  assert.doesNotMatch(styles, /\.countdown\b|\.eyebrow\b/);
  assert.match(gridCard, /<OfferCountdown/);
  assert.match(spotlight, /<OfferCountdown/);
});

test("mobile image first and full-width CTA have adequate tap height", () => {
  assert.match(styles, /@media \(max-width: 800px\)/);
  assert.match(styles, /\.media\s*\{\s*order:\s*-1;/);
  assert.match(styles, /\.button\s*\{[^}]*width:\s*100%/s);
  assert.match(styles, /\.button\s*\{[^}]*min-height:\s*50px/s);
});
