const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

const read = (path) => fs.readFileSync(path, "utf8");
const config = read("next.config.ts");
const upload = read("src/app/api/admin/uploads/route.ts");
const fallback = read("src/app/global-error.tsx");
const workflow = read(".github/workflows/security-audit.yml");
const pkg = JSON.parse(read("package.json"));

class FakeMongoError extends Error {
  constructor(message, code) { super(message); this.code = code; this.name = "MongoServerError"; }
}
const moduleRef = { exports: {} };
const transpiled = ts.transpileModule(read("src/lib/admin-api.ts"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
new Function("require", "module", "exports", transpiled)((name) => {
  if (name === "next/server") return { NextResponse: { json: (data, init) => ({ body: data, status: init?.status ?? 200 }) } };
  if (name === "mongodb") return { MongoError: FakeMongoError };
  if (name === "@/lib/admin-auth") return { hasAdminPermission: async () => true };
  throw Error("Unexpected mock import " + name);
}, moduleRef, moduleRef.exports);
const { apiError } = moduleRef.exports;

test("internal database failures never expose credentials or URLs in admin API responses", () => {
  const response = apiError(new FakeMongoError("MongoDB connection to mongodb+srv://secret:pw@private.example failed", 123));
  assert.equal(response.status, 503);
  assert.match(response.body.error, /Database temporarily unavailable/);
  assert.doesNotMatch(response.body.error, /mongodb:|secret|private\.example|pw/);
});

test("admin API preserves user-visible conflict and input validation responses", () => {
  assert.equal(apiError(new FakeMongoError("duplicate key", 11000)).status, 409);
  assert.equal(apiError(new SyntaxError("Unexpected token")).body.error, "Invalid request data.");
  const invalidProduct = apiError(new Error("Product name is required."));
  assert.equal(invalidProduct.status, 400);
  assert.equal(invalidProduct.body.error, "Product name is required.");
  const unexpected = apiError(new TypeError("Sensitive details"));
  assert.equal(unexpected.status, 500);
  assert.doesNotMatch(unexpected.body.error, /Sensitive details/);
});

test("Next production headers harden all pages and prevent admin API response caching", () => {
  for (const value of ["X-Content-Type-Options", "nosniff", "X-Frame-Options", "DENY", "Referrer-Policy", "Permissions-Policy", "camera=(self)", "private, no-store"]) {
    assert.ok(config.includes(value), "Missing production header " + value);
  }
  assert.match(config, /source:\s*"\/api\/admin\/:path\*"/);
});

test("image uploads reject large requests before buffering and avoid leaking provider messages", () => {
  assert.match(upload, /request\.headers\.get\("content-length"\)/);
  assert.match(upload, /declaredSize > MAX_FILE_SIZE \+ 1024 \* 1024/);
  assert.match(upload, /status: 413/);
  assert.match(upload, /status: 502/);
  assert.doesNotMatch(upload, /\{ error: message \}/);
});

test("deployment uses reproducible CI checks and a working global error boundary reset", () => {
  assert.match(workflow, /run: npm ci/);
  assert.match(workflow, /run: npm test/);
  assert.equal(pkg.engines.node, "22.x");
  assert.equal(pkg.scripts.test, "node --test");
  assert.match(fallback, /onClick=\{reset\}/);
  assert.doesNotMatch(fallback, /onClick=\{retry\}/);
});
