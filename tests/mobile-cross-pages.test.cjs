const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = (path) => fs.readFileSync(path, "utf8");
const gallery = read("src/components/ProductGallery.module.css");
const detail = read("src/components/ProductDetailClient.tsx");
const adminShell = read("src/components/AdminShell.tsx");
const adminForms = read("src/app/admin-forms.css");
const adminDrawer = read("src/components/AdminDrawer.tsx");
const tryOn = read("src/components/TryOnCamera.tsx");
const dealers = read("src/app/wholesale/page.module.css");
const mobile = read("src/app/mobile-ui.css");

test("product details stay in a single column with mobile image controls and readable prices", () => {
  assert.match(gallery, /@media \(max-width: 640px\)\s*\{/);
  assert.match(gallery, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(gallery, /aspect-ratio: 4 \/ 4\.7/);
  assert.match(gallery, /\.controls button \{ width: 44px; height: 44px; \}/);
  assert.match(gallery, /\.thumbnails::-webkit-scrollbar \{ display: none; \}/);
  assert.match(gallery, /\.primaryButton, \.secondaryButton \{ min-height: 52px/);
  assert.match(gallery, /env\(safe-area-inset-bottom\)/);
  assert.match(detail, /galleryStyles\.gallery/);
  assert.match(detail, /galleryStyles\.actions/);
  assert.match(detail, /selectedColor/);
  assert.match(detail, /Order on WhatsApp/);
});

test("small product-detail screens keep image and fact panels contained", () => {
  assert.match(gallery, /@media \(max-width: 370px\)/);
  assert.match(gallery, /\.attributes \{ grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(gallery, /\.gallery \{ aspect-ratio: 4 \/ 5/);
});

test("admin pages share safe-area content spacing, consistent tap targets and accessible nav state", () => {
  assert.match(adminShell, /data-admin-content/);
  assert.match(adminShell, /data-admin-mobile-nav/);
  assert.match(adminShell, /data-admin-more-menu/);
  assert.match(adminShell, /aria-current=\{active \? "page" : undefined\}/);
  assert.match(adminForms, /\[data-admin-content\] \{/);
  assert.match(adminForms, /padding-bottom: calc\(106px \+ env\(safe-area-inset-bottom\)\)/);
  assert.match(adminForms, /\[data-admin-mobile-nav\] a,/);
  assert.match(adminForms, /font-size: 16px/);
  assert.match(adminForms, /max-height: calc\(100dvh - 132px/);
  assert.match(adminDrawer, /role="dialog"/);
  assert.match(adminDrawer, /aria-modal="true"/);
});

test("camera and dealer portals work on compact touchscreens without forced desktop widths", () => {
  assert.match(tryOn, /data-tryon-camera-preview/);
  assert.match(tryOn, /min-h-\[min\(520px,70svh\)\]/);
  assert.match(tryOn, /text-\[clamp\(32px,9vw,42px\)\]/);
  assert.match(tryOn, /safe-area-inset-bottom/);
  assert.match(dealers, /@media \(max-width: 640px\)/);
  assert.match(dealers, /\.intro \{\s*grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(dealers, /\.content a \{ width: 100%; min-height: 50px/);
  assert.match(mobile, /font-size: 16px !important/);
});
