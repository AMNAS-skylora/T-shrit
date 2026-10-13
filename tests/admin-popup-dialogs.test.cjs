const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const read = (file) => fs.readFileSync(file, "utf8");
const provider = read("src/components/AdminDialogProvider.tsx");
const shell = read("src/components/AdminShell.tsx");
const managers = [
  ["Products", read("src/components/AdminProductsManager.tsx")],
  ["Hero", read("src/components/AdminHeroManager.tsx")],
  ["Animation bar", read("src/components/AdminAnimationBarManager.tsx")],
];

test("admin dialog provider offers reusable confirm, notice and prompt UI", () => {
  assert.match(provider, /createContext<DialogApi \| null>/);
  assert.match(provider, /confirm:.*Promise<boolean>/);
  assert.match(provider, /notice:.*Promise<void>/);
  assert.match(provider, /prompt:.*Promise<string \| null>/);
  assert.match(provider, /createPortal\(/);
  assert.match(provider, /aria-modal="true"/);
  assert.match(provider, /aria-labelledby=/);
  assert.match(provider, /aria-describedby=/);
  assert.match(provider, /role=\{request\.kind === "confirm"/);
  assert.match(provider, /request\.kind === "confirm" && request\.destructive/);
});

test("dialog traps focus, supports Escape, backdrop cancel and restores previous focus", () => {
  assert.match(provider, /event\.key === "Escape"/);
  assert.match(provider, /event\.key !== "Tab"/);
  assert.match(provider, /document\.body\.style\.overflow = "hidden"/);
  assert.match(provider, /previousFocus\.current\?\.isConnected/);
  assert.match(provider, /event\.target === event\.currentTarget/);
  assert.match(provider, /finish\?\.\(false\)/);
});

test("the custom popup provider wraps every authenticated admin page", () => {
  assert.match(shell, /<AdminDialogProvider>/);
  assert.match(shell, /<\/AdminDialogProvider>/);
  assert.match(shell, /\{children\}/);
});

for (const [name, source] of managers) {
  test(`${name} delete confirmation uses reusable popup instead of browser-native confirm`, () => {
    assert.match(source, /useAdminDialog\(\)/);
    assert.match(source, /await confirm\(\{/);
    assert.match(source, /destructive: true/);
    assert.match(source, /if \(!confirmed\) return;/);
    assert.doesNotMatch(source, /\b(?:window\.)?(?:confirm|alert|prompt)\s*\(/);
  });
}
