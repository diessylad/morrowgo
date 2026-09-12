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
const { syncPaidCustomerOrder, getCustomerOrderSyncDiagnostic } = await import(moduleUrl(sync));
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
    if (options.upstream) return Response.json(options.upstream, { status: options.status || 500 });
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

for (const [code, status, message] of [
  ['PGRST202', 404, 'Could not find the function public.record_paid_customer_order in the schema cache'],
  ['42501', 403, 'permission denied for schema morrowgo_private'],
  ['23503', 409, 'insert or update on table "customer_orders" violates foreign key constraint "customer_orders_user_id_fkey"'],
  [null, 401, 'Invalid API key']
]) test('preserves actionable SDK failure diagnostics: ' + String(code || status), async t => {
  const f = fixture(t, { status, upstream: { code, message, details: `Key (user_id)=(${owner}) missing; PRIVATE_ROW`, hint: 'PRIVATE_HINT' } });
  await assert.rejects(syncPaidCustomerOrder(f.session), error => {
    assert.equal(error.message, 'Account order storage failed');
    const log = getCustomerOrderSyncDiagnostic(error);
    assert.equal(log.code, code);
    assert.equal(log.details.httpStatus, status);
    assert.equal(log.details.stage, 'rpc');
    assert.ok(log.message.startsWith(message.split('"')[0]));
    const output = JSON.stringify(log);
    for (const hidden of [owner, 'PRIVATE_ROW', 'PRIVATE_HINT', key]) assert.equal(output.includes(hidden), false);
    return true;
  });
});

test('configuration, network and invalid RPC responses remain distinguishable', async t => {
  const f = fixture(t); delete process.env.SUPABASE_SECRET_KEY;
  await assert.rejects(syncPaidCustomerOrder(f.session), error => {
    const log = getCustomerOrderSyncDiagnostic(error);
    assert.equal(log.message, 'Account order storage is not configured');
    assert.equal(log.details.stage, 'configuration'); assert.equal(log.details.serverKeyConfigured, false);
    return true;
  });
  process.env.SUPABASE_SECRET_KEY = key;
  globalThis.fetch = async () => { throw new DOMException('The operation was aborted due to timeout', 'TimeoutError'); };
  await assert.rejects(syncPaidCustomerOrder(f.session), error => {
    const log = getCustomerOrderSyncDiagnostic(error);
    assert.match(log.message, /TimeoutError/); assert.equal(log.details.httpStatus, 0);
    assert.equal(log.details.stage, 'rpc'); assert.equal(JSON.stringify(log).includes('at '), false);
    return true;
  });
  globalThis.fetch = async () => Response.json({ private: 'INVALID_PRIVATE_RESULT' });
  await assert.rejects(syncPaidCustomerOrder(f.session), error => {
    const log = getCustomerOrderSyncDiagnostic(error);
    assert.equal(log.code, 'INVALID_RPC_RESPONSE'); assert.equal(log.details.stage, 'response');
    assert.equal(JSON.stringify(log).includes('INVALID_PRIVATE_RESULT'), false);
    return true;
  });
});

test('diagnostics redact configured credentials and common tokens in upstream messages and codes', async t => {
  fixture(t);
  const secrets = [key, 'sb_secret_foreign123', 'sk_live_fake123', 'whsec_fake123',
    'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0In0.fakeSignature',
    'cs_test_private123', 'cus_private123', owner, 'private@example.test'];
  for (const secret of secrets) {
    const log = getCustomerOrderSyncDiagnostic({ message: `Upstream failure ${secret}`, code: secret });
    assert.equal(JSON.stringify(log).includes(secret), false);
  }
  process.env.SUPABASE_SECRET_KEY = 'synthetic secret+value';
  const log = getCustomerOrderSyncDiagnostic({ message: `Upstream failure ${encodeURIComponent(process.env.SUPABASE_SECRET_KEY)}` });
  assert.equal(JSON.stringify(log).includes('synthetic'), false);
});

for (const unsafe of [
  'Cookie: session=PRIVATE_DATA', 'auth_token=PRIVATE_DATA', 'Authorization: Bearer PRIVATE_DATA',
  'Failing row contains (PRIVATE_DATA, other data).', 'Key (customer_name)=(PRIVATE_DATA) missing.',
  'DETAIL: PRIVATE_DATA', 'line one\nDETAIL: PRIVATE_DATA',
  'response {"customer":"PRIVATE_DATA"}', '<html>PRIVATE_DATA</html>',
  'https://private.test/?token=PRIVATE_DATA', 'invalid input syntax for type uuid: "PRIVATE_DATA"'
]) test('omits reflected credentials, payloads and database row contents: ' + unsafe.split(':')[0], () => {
  const log = getCustomerOrderSyncDiagnostic({ message: unsafe, details: 'PRIVATE_DATA', hint: 'PRIVATE_DATA', stack: 'PRIVATE_DATA' });
  assert.equal(JSON.stringify(log).includes('PRIVATE_DATA'), false);
  assert.deepEqual(Object.keys(log).sort(), ['code','details','message']);
  assert.ok(log.message.length <= 500);
});
