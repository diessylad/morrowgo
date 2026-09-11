import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const sdkPath = pathToFileURL(createRequire(import.meta.url).resolve('@supabase/supabase-js')).href;
const admin = (await readFile(new URL('../lib/supabase/admin.js', import.meta.url), 'utf8'))
  .replace("import 'server-only';", '').replace("'@supabase/supabase-js'", JSON.stringify(sdkPath));
const sync = (await readFile(new URL('../lib/account/stripeOrders.js', import.meta.url), 'utf8'))
  .replace("import 'server-only';", '').replace("'../supabase/admin'", JSON.stringify(moduleUrl(admin)));
const { syncPaidCustomerOrder } = await import(moduleUrl(sync));
const owner = '11111111-1111-4111-8111-111111111111';
const order = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const key = 'sb_secret_LOCAL_TEST_VALUE';

function fixture(t, options = {}) {
  const envNames = ['NEXT_PUBLIC_SUPABASE_URL','SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY'];
  const before = Object.fromEntries(envNames.map(name => [name,process.env[name]]));
  const oldFetch = globalThis.fetch;
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://accounts.example.test';
  process.env.SUPABASE_SECRET_KEY = key;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  t.after(() => {
    globalThis.fetch = oldFetch;
    for (const name of envNames) if (before[name] === undefined) delete process.env[name]; else process.env[name] = before[name];
  });
  const calls = [];
  globalThis.fetch = async (url, init) => {
    assert.equal(String(url), 'https://accounts.example.test/rest/v1/rpc/record_paid_customer_order');
    assert.equal(init.method, 'POST');
    assert.equal(init.cache, 'no-store');
    assert.ok(init.signal instanceof AbortSignal);
    const headers = new Headers(init.headers);
    assert.equal(headers.get('apikey'), options.legacy ? 'legacy_LOCAL_TEST_KEY' : key);
    assert.equal(headers.has('cookie'), false);
    calls.push(JSON.parse(init.body));
    if (options.throw) throw new Error('UPSTREAM_PRIVATE_VALUE');
    if (options.error) return Response.json({ message: 'UPSTREAM_PRIVATE_VALUE', code: 'test_error' }, { status: 503 });
    return Response.json(options.badResult ? { internal: 'UPSTREAM_PRIVATE_VALUE' } : order);
  };
  const session = { id: 'cs_test_account_example', mode: 'payment', created: 1700000000, amount_total: 0, currency: 'usd',
    metadata: { iso: 'de', morrowgo_user_id: owner, morrowgo_plan_name: 'Germany · 1 GB / 7 days' } };
  return { calls, session };
}

test('real Supabase SDK uses only server credentials and a strict paid-order payload', async t => {
  const f = fixture(t);
  assert.equal(await syncPaidCustomerOrder(f.session), order);
  assert.deepEqual(f.calls, [{ p_stripe_session_id: f.session.id, p_user_id: owner, p_destination_iso: 'DE',
    p_plan_name: 'Germany · 1 GB / 7 days', p_amount_total: 0, p_currency: 'USD', p_ordered_at: '2023-11-14T22:13:20.000Z' }]);
  assert.equal(JSON.stringify(f.calls).includes(key), false);
});

test('legacy privileged key remains a server-only fallback', async t => {
  const f = fixture(t, { legacy: true }); delete process.env.SUPABASE_SECRET_KEY; process.env.SUPABASE_SERVICE_ROLE_KEY = 'legacy_LOCAL_TEST_KEY';
  assert.equal(await syncPaidCustomerOrder(f.session), order);
});

test('guest skips Supabase even without configuration', async t => {
  const f = fixture(t); delete process.env.SUPABASE_SECRET_KEY; delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  assert.equal(await syncPaidCustomerOrder({ metadata: {} }), null); assert.equal(f.calls.length, 0);
});

test('missing privileged configuration fails closed for a linked payment', async t => {
  const f = fixture(t); delete process.env.SUPABASE_SECRET_KEY;
  await assert.rejects(syncPaidCustomerOrder(f.session), /not configured/); assert.equal(f.calls.length, 0);
});

test('legacy linked payment uses a customer-safe label, never supplier IDs', async t => {
  const f = fixture(t); delete f.session.metadata.morrowgo_plan_name; f.session.metadata.plan_id = 'SUPPLIER_INTERNAL_ID';
  await syncPaidCustomerOrder(f.session); assert.equal(f.calls[0].p_plan_name, 'MORROWGO DE eSIM');
  assert.equal(JSON.stringify(f.calls).includes('SUPPLIER_INTERNAL_ID'), false);
});

for (const changes of [
  { id: 'https://foreign.test' }, { mode: 'subscription' }, { amount_total: -1 },
  { amount_total: 1.2 }, { amount_total: Number.MAX_SAFE_INTEGER + 1 }, { currency: 'invalid' },
  { created: -1 }, { created: 999999999999 }, { metadata: { iso: 'DE', morrowgo_user_id: 'forged' } }
]) test('invalid linked payment is rejected before privileged network access: ' + JSON.stringify(changes), async t => {
  const f = fixture(t); await assert.rejects(syncPaidCustomerOrder({ ...f.session, ...changes })); assert.equal(f.calls.length, 0);
});

for (const options of [{ error: true }, { throw: true }, { badResult: true }]) test('upstream failures expose no private response: ' + JSON.stringify(options), async t => {
  const f = fixture(t, options);
  await assert.rejects(syncPaidCustomerOrder(f.session), error => error.message === 'Account order storage failed');
});
