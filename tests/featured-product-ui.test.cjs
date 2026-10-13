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

test("featured section omits eyebrow and countdown without changing other product timers", () => {
  assert.doesNotMatch(component, /KLEID\.IN \/ \{current\.category/);
  assert.doesNotMatch(component, /OfferCountdown|styles\.countdown|styles\.eyebrow/);
  assert.doesNotMatch(styles, /\.countdown\b|\.eyebrow\b/);
  assert.match(gridCard, /<OfferCountdown/);
  assert.match(spotlight, /<OfferCountdown/);
});

test("featured desktop layout is 60vh and has no outer border, radius or outline", () => {
  const section = styles.match(/\.section\s*\{([^}]+)\}/)?.[1] ?? "";
  const layout = styles.match(/\.layout\s*\{([^}]+)\}/)?.[1] ?? "";
  const media = [...styles.matchAll(/(?:^|\n)\.media\s*\{([^}]+)\}/g)]
    .map((match) => match[1])
    .find((rule) => rule.includes("border: 0;")) ?? "";
  assert.match(section, /min-height:\s*60svh/);
  assert.match(layout, /border:\s*0/);
  assert.match(layout, /border-radius:\s*0/);
  assert.match(layout, /outline:\s*0/);
  assert.match(layout, /background:\s*transparent/);
  assert.match(media, /border:\s*0/);
  assert.match(media, /border-radius:\s*0/);
  assert.match(media, /object-fit|background:\s*#f0f0ef/);
});

test("tablet and mobile use image-first single column and full-width accessible CTA", () => {
  assert.match(styles, /@media \(max-width: 900px\)/);
  assert.match(styles, /flex-direction:\s*column/);
  assert.match(styles, /order:\s*-1/);
  assert.match(styles, /\.button\s*\{[^}]*width:\s*100%/s);
  assert.match(styles, /\.button\s*\{[^}]*min-height:\s*50px/s);
  assert.match(styles, /@media \(max-width: 380px\)/);
});
