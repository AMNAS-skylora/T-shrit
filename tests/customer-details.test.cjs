const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const { ObjectId } = require('mongodb');

function setup(customer, orders = []) {
  const calls = [];
  const db = { collection(name) {
    calls.push(['collection', name]);
    if (name === 'customers') return { findOne: async (filter) => { calls.push(['customer', String(filter._id)]); return customer; } };
    return { find(filter) {
      calls.push(['orders', filter]);
      return { sort(sort) { calls.push(['sort', sort]); return this; }, limit(limit) { calls.push(['limit', limit]); return this; }, toArray: async () => orders };
    } };
  } };
  const result = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync('src/lib/mongodb-orders.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  new Function('require', 'module', 'exports', code)((name) => {
    if (name === '@/lib/mongodb') return { getDb: async () => db };
    if (name === 'mongodb') return { ObjectId };
    if (name === 'node:crypto') return require(name);
    return {};
  }, result, result.exports);
  return { get: result.exports.getCustomerDetails, calls };
}

const id = '507f1f77bcf86cd799439011';
test('customer history uses the stored phone and returns serialized customer and orders', async () => {
  const { get, calls } = setup({ _id: new ObjectId(id), name: 'Customer', phone: '+919999999999', addresses: ['Address'], notes: 'Note' }, [{ _id: new ObjectId(), orderNumber: 'ORDER-1', customer: { phone: '+919999999999' }, total: 500, createdAt: new Date('2026-10-01') }]);
  const details = await get(id);
  assert.equal(details.customer.id, id);
  assert.deepEqual(details.customer.addresses, ['Address']);
  assert.equal(details.orders[0].total, 500);
  assert.equal(details.orders[0].createdAt, '2026-10-01T00:00:00.000Z');
  assert.deepEqual(calls.find(([name]) => name === 'orders')[1], { 'customer.phone': '+919999999999' });
  assert.deepEqual(calls.find(([name]) => name === 'sort')[1], { createdAt: -1 });
  assert.equal(details.hasMoreOrders, false);
});
test('invalid or missing customers never query order history', async () => {
  const invalid = setup(null);
  assert.equal(await invalid.get('invalid'), null);
  assert.deepEqual(invalid.calls, []);
  assert.equal(await invalid.get(id), null);
  assert.equal(invalid.calls.some(([name]) => name === 'orders'), false);
  const missingPhone = setup({ _id: new ObjectId(id), name: 'Customer' });
  assert.deepEqual((await missingPhone.get(id)).orders, []);
  assert.equal(missingPhone.calls.some(([name]) => name === 'orders'), false);
});
test('large order histories are bounded and clearly report more orders', async () => {
  const { get, calls } = setup({ _id: new ObjectId(id), phone: '123' }, Array.from({ length: 101 }, () => ({ _id: new ObjectId(), customer: { phone: '123' } })));
  const details = await get(id);
  assert.equal(details.orders.length, 100);
  assert.equal(details.hasMoreOrders, true);
  assert.equal(calls.find(([name]) => name === 'limit')[1], 101);
});
