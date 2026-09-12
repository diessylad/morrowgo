import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash, createHmac } from 'node:crypto';

const moduleUrl = (source) => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const fulfillment = await readFile(new URL('../lib/esimgoFulfillment.js', import.meta.url), 'utf8');
const adminStub = moduleUrl('export function createAdminSupabaseClient() { return globalThis.__webhookAdmin; }');
const accountSync = (await readFile(new URL('../lib/account/stripeOrders.js', import.meta.url), 'utf8'))
  .replace("import 'server-only';", '')
  .replace("'../supabase/admin'", JSON.stringify(adminStub));
const webhook = (await readFile(new URL('../app/api/stripe/webhook/route.js', import.meta.url), 'utf8'))
  .replace("'../../../../lib/esimgoFulfillment'", JSON.stringify(moduleUrl(fulfillment)))
  .replace("'../../../../lib/account/stripeOrders'", JSON.stringify(moduleUrl(accountSync)));
const { POST } = await import(moduleUrl(webhook));
const bundleName = 'test_bundle';
const planId = createHash('sha256').update(bundleName).digest('hex').slice(0, 16);
const orderKey = 'morrowgo:order:cs_test_example';
const lockKey = 'morrowgo:lock:cs_test_example';
const attemptKey = 'morrowgo:fulfillment-attempt:cs_test_example';

function fixture(flag, options = {}) {
  process.env.STRIPE_WEBHOOK_SECRET = 'test_webhook_secret';
  process.env.ESIM_GO_API_KEY = 'test_esim_key';
  process.env.STORAGE_KV_REST_API_URL = 'https://redis.test';
  process.env.STORAGE_KV_REST_API_TOKEN = 'test_redis_token';
  if (flag === undefined) delete process.env.ESIM_GO_FULFILLMENT_ENABLED;
  else process.env.ESIM_GO_FULFILLMENT_ENABLED = flag;
  const db = new Map();
  const calls = [];
  const accountCalls = [];
  let accountFailures = options.accountFailures || 0;
  globalThis.__webhookAdmin = { rpc: async (name, args) => {
    accountCalls.push({ name, args });
    if (options.accountError) return { data: null, error: options.accountError, status: options.accountStatus };
    if (options.accountOwnerMismatch || accountFailures-- > 0) return { data: null, error: { message: 'test-private-database-error' } };
    return { data: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', error: null };
  } };
  let installFailures = options.installFailures || 0;
  globalThis.fetch = async (url, init = {}) => {
    url = String(url);
    const body = init.body ? JSON.parse(init.body) : null;
    if (url === 'https://redis.test') {
      if (options.redisError) return Response.json({ error: 'test Redis failure' });
      const [command, key, value, modifier] = body;
      let result;
      if (command === 'GET') result = db.get(key) ?? null;
      else if (command === 'SET') {
        if (modifier === 'NX' && db.has(key)) result = null;
        else { db.set(key, value); result = 'OK'; }
      } else if (command === 'EVAL') {
        const count = Number(body[2]);
        const keys = body.slice(3, 3 + count);
        const args = body.slice(3 + count);
        if (count === 2) {
          const next = JSON.parse(args[1]);
          if (options.failReferenceSave && next.orderReference) throw new Error('test write failure');
          if (options.loseLock && next.status === 'fulfilling') db.set(lockKey, 'another-owner');
          result = db.get(keys[0]) === args[0] ? 1 : 0;
          if (result) db.set(keys[1], args[1]);
        } else {
          result = db.get(keys[0]) === args[0] ? 1 : 0;
          if (result) db.delete(keys[0]);
        }
      } else throw new Error('Unexpected Redis command');
      return Response.json({ result });
    }
    calls.push(body?.type || (url.includes('catalogue') ? 'catalogue' : 'install'));
    if (url.includes('/catalogue?')) {
      return Response.json([{ name: bundleName, countries: [{ iso: 'DE' }] }]);
    }
    if (body?.type === 'validate') return Response.json({ valid: options.valid !== false, total: 1, currency: 'USD' });
    if (body?.type === 'transaction') {
      if (options.transactionError) throw new Error('test uncertain transaction');
      return Response.json({ orderReference: 'test_order_reference' });
    }
    if (url.includes('/esims/assignments?')) {
      assert.equal(new URL(url).searchParams.get('reference'), 'test_order_reference');
      if (installFailures-- > 0) return Response.json({}, { status: 503 });
      return Response.json([{ matchingId: 'test_matching_id', smdpAddress: 'test.smdp', iccid: 'test_iccid' }]);
    }
    throw new Error('Unexpected network request');
  };
  async function send(overrides = {}, signatureValid = true, age = 0) {
    const payload = JSON.stringify({
      id: 'evt_test', type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_example', payment_status: 'paid', metadata: { iso: 'DE', plan_id: planId } } },
      ...overrides
    });
    const timestamp = Math.floor(Date.now() / 1000) - age;
    const signature = createHmac('sha256', process.env.STRIPE_WEBHOOK_SECRET).update(timestamp + '.' + payload).digest('hex');
    return POST(new Request('https://morrowgo.test/api/stripe/webhook', {
      method: 'POST', body: payload,
      headers: { 'stripe-signature': 't=' + timestamp + ',v1=' + (signatureValid ? signature : 'bad') }
    }));
  }
  return { db, calls, accountCalls, send, order: () => JSON.parse(db.get(orderKey)) };
}

for (const flag of [undefined, '', 'false', 'FALSE', '1', 'yes', ' true ']) {
  test('flag ' + JSON.stringify(flag) + ' never buys', async () => {
    const f = fixture(flag);
    assert.equal((await f.send()).status, 200);
    assert.deepEqual(f.calls, ['catalogue', 'validate']);
    assert.equal(f.order().status, 'validated');
    assert.equal(f.order().fulfillmentStatus, 'awaiting_fulfillment');
    await f.send();
    assert.equal(f.calls.length, 2);
  });
}

test('enabled: validates, buys once, saves reference and installation, ignores duplicate event types', async () => {
  const f = fixture('true');
  assert.equal((await f.send()).status, 200);
  assert.deepEqual(f.calls, ['catalogue', 'validate', 'transaction', 'install']);
  assert.equal(f.order().status, 'ready');
  assert.equal(f.order().orderReference, 'test_order_reference');
  assert.equal(f.order().installDetails.activationCode, 'LPA:1$test.smdp$test_matching_id');
  await f.send();
  await f.send({ id: 'evt_async', type: 'checkout.session.async_payment_succeeded' });
  assert.equal(f.calls.filter(x => x === 'transaction').length, 1);
  assert.ok(f.db.has(attemptKey));
});

test('failed validation cannot buy', async () => {
  const f = fixture('true', { valid: false });
  await f.send();
  assert.equal(f.order().status, 'validation_failed');
  assert.deepEqual(f.calls, ['catalogue', 'validate']);
});

test('invalid or expired signature has no side effects', async () => {
  const f = fixture('true');
  assert.equal((await f.send({}, false)).status, 400);
  assert.equal((await f.send({}, true, 301)).status, 400);
  assert.equal(f.db.size, 0);
  assert.equal(f.calls.length, 0);
});

test('irrelevant and unpaid events have no side effects', async () => {
  const f = fixture('true');
  await f.send({ type: 'customer.created' });
  await f.send({ data: { object: { payment_status: 'unpaid' } } });
  assert.equal(f.db.size, 0);
  assert.equal(f.calls.length, 0);
});

test('active lock asks Stripe to retry and remains owned by other worker', async () => {
  const f = fixture('true');
  f.db.set(lockKey, 'another-owner');
  assert.equal((await f.send()).status, 503);
  assert.equal(f.db.get(lockKey), 'another-owner');
  assert.equal(f.calls.length, 0);
});

test('installation failure retries details without a second purchase', async () => {
  const f = fixture('true', { installFailures: 1 });
  assert.equal((await f.send()).status, 500);
  assert.equal(f.order().orderReference, 'test_order_reference');
  assert.equal(f.order().fulfillmentStatus, 'installation_pending');
  assert.equal((await f.send()).status, 200);
  assert.equal(f.order().status, 'ready');
  assert.equal(f.calls.filter(x => x === 'transaction').length, 1);
  assert.equal(f.calls.filter(x => x === 'install').length, 2);
});

test('ambiguous transaction is never repeated', async () => {
  const f = fixture('true', { transactionError: true });
  assert.equal((await f.send()).status, 500);
  const retry = await f.send();
  assert.equal((await retry.json()).requiresReconciliation, true);
  assert.equal(f.calls.filter(x => x === 'transaction').length, 1);
});

test('failed reference persistence is never followed by another purchase', async () => {
  const f = fixture('true', { failReferenceSave: true });
  assert.equal((await f.send()).status, 500);
  await f.send();
  assert.equal(f.calls.filter(x => x === 'transaction').length, 1);
  assert.equal(f.calls.filter(x => x === 'install').length, 0);
});

test('Redis error response stops all provider requests', async () => {
  const f = fixture('true', { redisError: true });
  assert.equal((await f.send()).status, 500);
  assert.equal(f.calls.length, 0);
});

test('lost lock prevents purchase and cannot delete another owner lock', async () => {
  const f = fixture('true', { loseLock: true });
  assert.equal((await f.send()).status, 500);
  assert.equal(f.db.get(lockKey), 'another-owner');
  assert.equal(f.calls.filter(x => x === 'transaction').length, 0);
});

test('previously validated order can be fulfilled after explicit enable and Stripe resend', async () => {
  const f = fixture('false');
  await f.send();
  process.env.ESIM_GO_FULFILLMENT_ENABLED = 'true';
  await f.send();
  assert.equal(f.order().status, 'ready');
  assert.equal(f.calls.filter(x => x === 'transaction').length, 1);
});

test('disabling flag pauses retries of installation', async () => {
  const f = fixture('true', { installFailures: 1 });
  await f.send();
  process.env.ESIM_GO_FULFILLMENT_ENABLED = 'false';
  await f.send();
  assert.equal(f.calls.filter(x => x === 'install').length, 1);
});

test('corrupt stored order fails closed', async () => {
  const f = fixture('true');
  f.db.set(orderKey, '{invalid');
  assert.equal((await f.send()).status, 500);
  assert.equal(f.calls.length, 0);
});

test('concurrent deliveries purchase at most once', async () => {
  const f = fixture('true');
  const results = await Promise.all([f.send(), f.send()]);
  assert.deepEqual(results.map(r => r.status).sort(), [200, 503]);
  assert.equal(f.calls.filter(x => x === 'transaction').length, 1);
  assert.equal(f.order().status, 'ready');
});

test('interruption before purchase marker can safely resume', async () => {
  const f = fixture('true');
  f.db.set(orderKey, JSON.stringify({ status: 'fulfilling', fulfillmentStatus: 'transaction_pending' }));
  assert.equal((await f.send()).status, 200);
  assert.equal(f.order().status, 'ready');
  assert.equal(f.calls.filter(x => x === 'transaction').length, 1);
});

const accountUser = '11111111-1111-4111-8111-111111111111';
const linkedPayment = (changes = {}) => ({
  data: { object: { id: 'cs_test_example', mode: 'payment', payment_status: 'paid',
    amount_total: 499, currency: 'usd', created: 1700000000,
    metadata: { iso: 'DE', plan_id: planId, morrowgo_user_id: accountUser, morrowgo_plan_name: 'Germany · 1 GB / 7 days' }, ...changes } }
});

test('paid account order is written before supplier validation and remains independent of failure', async () => {
  const f = fixture('false', { valid: false });
  assert.equal((await f.send(linkedPayment())).status, 200);
  assert.equal(f.accountCalls.length, 1);
  assert.equal(f.accountCalls[0].name, 'record_paid_customer_order');
  assert.deepEqual(f.accountCalls[0].args, {
    p_stripe_session_id: 'cs_test_example', p_user_id: accountUser, p_destination_iso: 'DE',
    p_plan_name: 'Germany · 1 GB / 7 days', p_amount_total: 499, p_currency: 'USD', p_ordered_at: '2023-11-14T22:13:20.000Z'
  });
  assert.equal(f.order().status, 'validation_failed');
  assert.deepEqual(f.calls, ['catalogue', 'validate']);
});

test('guest webhooks do not use privileged Supabase', async () => {
  const f = fixture('false'); await f.send(); assert.equal(f.accountCalls.length, 0);
});

test('invalid signatures, unpaid and irrelevant account events cannot write anything', async () => {
  const f = fixture('false');
  assert.equal((await f.send(linkedPayment(), false)).status, 400);
  assert.equal((await f.send(linkedPayment(), true, 301)).status, 400);
  await f.send(linkedPayment({ payment_status: 'unpaid' }));
  await f.send({ ...linkedPayment(), type: 'customer.created' });
  assert.equal(f.accountCalls.length, 0); assert.equal(f.db.size, 0); assert.equal(f.calls.length, 0);
});

test('invalid signed account ID fails closed without touching Redis or supplier', async () => {
  const f = fixture('false');
  const result = await f.send(linkedPayment({ metadata: { iso: 'DE', plan_id: planId, morrowgo_user_id: 'invalid' } }));
  assert.equal(result.status, 500); assert.equal(f.accountCalls.length, 0); assert.equal(f.db.size, 0); assert.equal(f.calls.length, 0);
});

test('account storage failure retries before fulfillment and exposes no upstream error', async () => {
  const f = fixture('false', { accountFailures: 1 });
  const result = await f.send(linkedPayment());
  assert.equal(result.status, 500); assert.equal((await result.text()).includes('test-private'), false);
  assert.equal(f.db.size, 0); assert.equal(f.calls.length, 0);
  assert.equal((await f.send(linkedPayment())).status, 200);
  assert.equal(f.accountCalls.length, 2); assert.deepEqual(f.calls, ['catalogue','validate']);
});

test('account sync logs safe Supabase diagnostics only on the server and stays fail closed', async t => {
  const f = fixture('false', { accountStatus: 404, accountError: {
    message: 'Could not find the function public.record_paid_customer_order in the schema cache', code: 'PGRST202',
    details: 'PRIVATE_ROW_DATA', hint: 'PRIVATE_HINT', headers: { authorization: 'PRIVATE_AUTH' }
  } });
  const logged = t.mock.method(console, 'error', () => {});
  const response = await f.send(linkedPayment());
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), { received: false, error: 'Account order storage failed' });
  assert.equal(f.db.size, 0); assert.equal(f.calls.length, 0);
  const [marker, diagnostic] = logged.mock.calls[0].arguments;
  assert.equal(marker, 'MORROWGO_CUSTOMER_ORDER_SYNC_FAILED');
  assert.equal(diagnostic.code, 'PGRST202'); assert.match(diagnostic.message, /schema cache/);
  assert.equal(diagnostic.details.httpStatus, 404); assert.equal(diagnostic.details.stage, 'rpc');
  assert.equal(JSON.stringify(diagnostic).includes('PRIVATE_'), false);
  assert.equal(JSON.stringify(diagnostic).includes('cs_test_'), false);
});

test('reflected secrets never reach webhook diagnostics or HTTP responses', async t => {
  const f = fixture('false', { accountStatus: 403, accountError: {
    message: 'permission denied test_webhook_secret test_redis_token test_esim_key sk_live_FAKE_SECRET',
    code: '42501', details: 'customer PRIVATE_DATA', stack: 'token PRIVATE_DATA'
  } });
  const logged = t.mock.method(console, 'error', () => {});
  const response = await f.send(linkedPayment());
  const output = JSON.stringify(logged.mock.calls.map(call => call.arguments)) + await response.text();
  for (const secret of ['test_webhook_secret', 'test_redis_token', 'test_esim_key', 'sk_live_FAKE_SECRET', 'PRIVATE_DATA']) {
    assert.equal(output.includes(secret), false);
  }
  assert.match(output, /permission denied/); assert.match(output, /42501/);
  assert.equal(response.status, 500); assert.equal(f.db.size, 0); assert.equal(f.calls.length, 0);
});

test('a rejected RPC promise is logged safely and guest requests still skip it', async t => {
  const f = fixture('false');
  globalThis.__webhookAdmin.rpc = async () => { throw Object.assign(new Error('fetch failed'), { code: 'ECONNRESET', details: 'PRIVATE_DATA' }); };
  const logged = t.mock.method(console, 'error', () => {});
  assert.equal((await f.send(linkedPayment())).status, 500);
  const diagnostic = logged.mock.calls[0].arguments[1];
  assert.equal(diagnostic.message, 'fetch failed'); assert.equal(diagnostic.code, 'ECONNRESET');
  assert.equal(diagnostic.details.stage, 'rpc'); assert.equal(f.db.size, 0); assert.equal(f.calls.length, 0);
  assert.equal((await f.send()).status, 200);
  assert.equal(logged.mock.calls.length, 1);
});

test('a Redis-ready duplicate still repairs the account row without provider calls', async () => {
  const f = fixture('false'); f.db.set(orderKey, JSON.stringify({ status: 'ready' }));
  assert.equal((await f.send(linkedPayment())).status, 200);
  assert.equal(f.accountCalls.length, 1); assert.equal(f.calls.length, 0);
});

test('account duplicate and async-success events do not repeat fulfillment', async () => {
  const f = fixture('true');
  await f.send(linkedPayment());
  await f.send(linkedPayment());
  await f.send({ ...linkedPayment(), type: 'checkout.session.async_payment_succeeded' });
  assert.equal(f.accountCalls.length, 3);
  assert.equal(f.calls.filter(x => x === 'transaction').length, 1);
});

test('account owner conflict fails closed before existing Redis and supplier work', async () => {
  const f = fixture('false', { accountOwnerMismatch: true });
  assert.equal((await f.send(linkedPayment())).status, 500); assert.equal(f.db.size, 0); assert.equal(f.calls.length, 0);
});

test('concurrent linked events retain the original Redis purchase lock', async () => {
  const f = fixture('true');
  const responses = await Promise.all([f.send(linkedPayment()), f.send(linkedPayment())]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200,503]);
  assert.equal(f.calls.filter(x => x === 'transaction').length, 1);
});
