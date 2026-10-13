const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = file => fs.readFileSync(file, "utf8");
const motion = read("src/components/HomeShoppingMotion.tsx");
const site = read("src/components/SiteChrome.tsx");
const mobile = read("src/app/mobile-ui.css");
const icons = read("src/components/UiIcons.tsx");
const favicon = read("src/app/icon.svg");

test("mobile storefront uses one-shot native reveals and never hides product content until animation begins", () => {
  assert.match(motion, /matchMedia\("\(max-width: 767px\)"\)/);
  assert.match(motion, /new IntersectionObserver/);
  assert.match(motion, /new WeakSet<HTMLElement>/);
  assert.match(motion, /seen\.add\(element\)/);
  assert.match(motion, /observer\.unobserve\(element\)/);
  assert.match(motion, /typeof element\.animate !== "function"/);
  assert.match(motion, /if \(!\("IntersectionObserver" in window\)\) return;/);
  assert.match(motion, /mutation[s]?\.observe\(root, \{ childList: true, subtree: true \}\)/);
  assert.doesNotMatch(motion, /opacity:\s*0,\s*transform:/);
});

test("mobile horizontal clipping replaces scrollTo loop, avoiding scroll shaking", () => {
  assert.doesNotMatch(site, /lockViewportX|document\.documentElement\.scrollLeft|window\.scrollTo\(0, top\)/);
  assert.match(mobile, /@media \(max-width: 767px\)[\s\S]*html, body \{ max-width: 100%; overflow-x: clip; \}/);
});

test("important storefront controls use accessible inline SVG icons, not arrow text or font libraries", () => {
  for(const name of ["ArrowUpRightIcon", "ArrowLeftIcon", "ArrowRightIcon", "MenuIcon"]){
    assert.ok(icons.includes("function " + name + "(") || icons.includes("function " + name + "({"), "Missing " + name);
  }
  assert.match(icons, /aria-hidden/);
  assert.match(icons, /viewBox: "0 0 24 24"/);
  const components = [
    ["src/components/Header.tsx", "MenuIcon"],
    ["src/components/StaticEditorialHero.tsx", "ArrowUpRightIcon"],
    ["src/components/HomeAllProductsSection.tsx", "ArrowUpRightIcon"],
    ["src/components/HomeAboutSection.tsx", "ArrowUpRightIcon"],
    ["src/components/FeaturedProductMotion.tsx", "ArrowLeftIcon"],
    ["src/components/ProductDetailClient.tsx", "ArrowRightIcon"],
  ];
  for(const [path, icon] of components) {
    assert.ok(read(path).includes("<" + icon), path + " must render SVG " + icon);
  }
  assert.doesNotMatch(read("src/components/Header.tsx"), /<i\s*\/>/);
  assert.doesNotMatch(read("src/components/ProductDetailClient.tsx"), />[←→]<\/button>/);
});

test("brand SVG favicon loads from Next app icon route", () => {
  assert.match(favicon, /^<svg /);
  assert.match(favicon, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(favicon, /viewBox="0 0 64 64"/);
  assert.match(favicon, /<title id="title">KLEID.IN<\/title>/);
});
