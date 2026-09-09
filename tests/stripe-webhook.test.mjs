import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash, createHmac } from 'node:crypto';

const moduleUrl = (source) => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const fulfillment = await readFile(new URL('../lib/esimgoFulfillment.js', import.meta.url), 'utf8');
const webhook = (await readFile(new URL('../app/api/stripe/webhook/route.js', import.meta.url), 'utf8'))
  .replace("'../../../../lib/esimgoFulfillment'", JSON.stringify(moduleUrl(fulfillment)));
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
  return { db, calls, send, order: () => JSON.parse(db.get(orderKey)) };
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
