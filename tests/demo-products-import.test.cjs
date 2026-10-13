const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const csv = fs.readFileSync("public/templates/kleidin-15-demo-products.csv", "utf8");
const importer = fs.readFileSync("src/components/AdminProductImport.tsx", "utf8");
const lines = csv.trim().split(/\r?\n/);

// Respect CSV quoting, including descriptions that contain commas.
function parseCsvLine(line) {
  const cells = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    if (line[i] === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (line[i] === "," && !quoted) {
      cells.push(value);
      value = "";
    } else {
      value += line[i];
    }
  }
  cells.push(value);
  assert.equal(quoted, false, "Unclosed CSV quote");
  return cells;
}
const columns = parseCsvLine(lines[0]);
const data = lines.slice(1).map((line) => {
  const cells = parseCsvLine(line);
  assert.equal(cells.length, columns.length, "CSV variant has the wrong column count");
  return Object.fromEntries(cells.map((value, i) => [columns[i], value]));
});

test("15 realistic example products use the existing 21-column admin CSV template", () => {
  assert.equal(columns.length, 21);
  assert.deepEqual(columns.slice(0, 6), [
    "sku", "name", "category", "price", "compare_at_price", "status",
  ]);
  assert.equal(data.length, 120);
  assert.equal(new Set(data.map(row => row.sku)).size, 15);
  assert.equal(new Set(data.map(row => row.name)).size, 15);
  assert.ok(data.every(row => columns.every(key => Object.hasOwn(row, key))));
});

test("example products have correct colour + size variants and real-looking descriptions", () => {
  for (const sku of new Set(data.map(row => row.sku))) {
    const group = data.filter(row => row.sku === sku);
    assert.match(sku, /^KLD-DEMO-\d{3}$/);
    assert.equal(group.length, 8);
    assert.equal(new Set(group.map(row => row.color)).size, 2);
    for (const color of new Set(group.map(row => row.color))) {
      assert.deepEqual(group.filter(row => row.color === color).map(row => row.size), ["S", "M", "L", "XL"]);
    }
    assert.ok(group.every(row => /^#[0-9A-Fa-f]{6}$/.test(row.color_value)));
    assert.ok(group.every(row => row.description.length >= 45));
    assert.ok(group.every(row => Number(row.price) >= 400 && Number(row.price) <= 1000));
  }
});

test("import sample cannot create fake live inventory or false offer countdowns", () => {
  assert.ok(data.every(row => row.status === "draft"));
  assert.ok(data.every(row => row.stock === "0"));
  assert.ok(data.every(row => row.offer_enabled === "false"));
  assert.ok(data.every(row => row.animation_enabled === "false"));
  assert.ok(data.every(row => row.main_image_url === "" && row.color_image_url === ""));
  assert.ok(data.every(row => row.offer_value === "" && row.offer_badge === ""));
});

test("admin import screen offers sample CSV as a separate download, never auto-imports it", () => {
  assert.match(importer, /href="\/templates\/kleidin-15-demo-products\.csv"/);
  assert.match(importer, /Download 15 demo products/);
  assert.match(importer, /draft products with zero stock/);
  assert.match(importer, /onClick=\{\(\) => void runImport\(\)\}/);
  assert.match(importer, /method: "POST"/);
});
