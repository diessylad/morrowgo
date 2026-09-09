import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const { orderPresentation } = await import(moduleUrl(await readFile(new URL('../lib/orderPresentation.js', import.meta.url), 'utf8')));
const { GET } = await import(moduleUrl(await readFile(new URL('../app/api/orders/status/route.js', import.meta.url), 'utf8')));

test('missing order keeps the payment check in progress', () => {
  const result = orderPresentation(null);
  assert.equal(result.key, 'loading');
  assert.equal(result.poll, true);
  assert.match(result.title, /checking your payment/i);
});

test('unconfirmed payment takes precedence over a stored ready status', () => {
  const result = orderPresentation({ paid: false, status: 'ready' });
  assert.equal(result.key, 'payment_pending');
  assert.equal(result.poll, true);
  assert.match(result.text, /do not pay again/i);
});

for (const status of ['validated', 'awaiting_fulfillment']) {
  test(status + ' stops automatic polling and never claims installation is available', () => {
    const result = orderPresentation({ paid: true, status });
    assert.equal(result.key, 'waiting');
    assert.equal(result.poll, false);
    assert.match(result.text, /has not been issued/i);
    assert.match(result.text, /do not need to pay again/i);
  });
}

test('the fulfillment waiting state is recognized even before status catches up', () => {
  const result = orderPresentation({ paid: true, status: 'processing', fulfillmentStatus: 'awaiting_fulfillment' });
  assert.equal(result.key, 'waiting');
  assert.equal(result.poll, false);
});

for (const status of ['validation_failed', 'failed', 'fulfillment_failed']) {
  test(status + ' stops polling and explains that payment is already confirmed', () => {
    const result = orderPresentation({ paid: true, status, fulfillmentStatus: 'awaiting_fulfillment' });
    assert.equal(result.key, 'attention');
    assert.equal(result.poll, false);
    assert.match(result.text, /payment is confirmed/i);
    assert.match(result.text, /do not place the same order again/i);
  });
}

test('ready is terminal and accurately states the page delivery limitation', () => {
  const result = orderPresentation({ paid: true, status: 'ready' });
  assert.equal(result.key, 'ready');
  assert.equal(result.poll, false);
  assert.match(result.text, /has been issued/i);
  assert.match(result.text, /not yet available on this page/i);
});

test('an uncertain transaction asks for review instead of endless preparation', () => {
  const result = orderPresentation({ paid: true, status: 'fulfilling', fulfillmentStatus: 'transaction_pending' });
  assert.equal(result.key, 'attention');
  assert.equal(result.poll, false);
  assert.match(result.text, /do not pay again/i);
});

for (const status of ['processing', 'fulfilling']) {
  test(status + ' continues checking without claiming the eSIM is ready', () => {
    const result = orderPresentation({ paid: true, status });
    assert.equal(result.key, 'processing');
    assert.equal(result.poll, true);
    assert.match(result.text, /does not mean the eSIM is ready/i);
  });
}

for (const status of [undefined, 'unknown_future_state']) {
  test('unrecognized status ' + String(status) + ' fails closed into a review state', () => {
    const result = orderPresentation({ paid: true, status });
    assert.equal(result.key, 'attention');
    assert.equal(result.poll, false);
  });
}

function fixture(t, options = {}) {
  const originalFetch = globalThis.fetch;
  const envNames = ['STRIPE_SECRET_KEY', 'STORAGE_KV_REST_API_URL', 'STORAGE_KV_REST_API_TOKEN', 'KV_REST_API_URL', 'KV_REST_API_TOKEN', 'UPSTASH_REDIS_REST_URL', 'UPSTASH_REDIS_REST_TOKEN'];
  const originalEnv = new Map(envNames.map(name => [name, process.env[name]]));
  for (const name of envNames) delete process.env[name];
  process.env.STRIPE_SECRET_KEY = 'test-only-stripe-secret';
  process.env.STORAGE_KV_REST_API_URL = 'https://order-status-redis.test';
  process.env.STORAGE_KV_REST_API_TOKEN = 'test-only-redis-secret';
  t.after(() => {
    globalThis.fetch = originalFetch;
    for (const [name, value] of originalEnv) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  });

  const calls = [];
  const session = { id: 'cs_test_example', payment_status: 'paid', livemode: false, amount_total: 500, currency: 'usd', ...options.session };
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    if (String(url).startsWith('https://api.stripe.com/v1/checkout/sessions/')) {
      assert.equal(init.cache, 'no-store');
      if (options.stripeThrow) throw new Error('test-only-stripe-secret');
      if (options.stripeMalformed) return new Response('not JSON');
      return Response.json(session, { status: options.stripeStatus || 200 });
    }
    if (url === 'https://order-status-redis.test') {
      assert.equal(init.method, 'POST');
      assert.equal(init.cache, 'no-store');
      assert.deepEqual(JSON.parse(init.body), ['GET', 'morrowgo:order:' + (options.sessionId || 'cs_test_example')]);
      if (options.redisThrow) throw new Error('test-only-redis-secret');
      if (options.redisMalformed) return new Response('not JSON');
      if (options.redisError) return Response.json({ error: 'test-only-redis-secret' });
      const stored = Object.hasOwn(options, 'stored') ? options.stored : options.order ? JSON.stringify(options.order) : null;
      return Response.json({ result: stored }, { status: options.redisStatus || 200 });
    }
    assert.fail('Unexpected external request: ' + String(url));
  };

  async function get(sessionId = options.sessionId || 'cs_test_example') {
    const url = new URL('https://morrowgo.test/api/orders/status');
    if (sessionId !== null) url.searchParams.set('session_id', sessionId);
    const response = await GET(new Request(url));
    return { response, data: await response.json() };
  }
  return { calls, get };
}

for (const sessionId of [null, '', 'arbitrary', 'cs_test_', 'cs_test_invalid/path', 'cs_test_value?other=secret', 'cs_test_value\nextra']) {
  test('invalid session ' + JSON.stringify(sessionId) + ' returns 400 without network requests', async t => {
    const f = fixture(t);
    const { response, data } = await f.get(sessionId);
    assert.equal(response.status, 400);
    assert.deepEqual(data, { ok: false, error: 'Invalid session' });
    assert.equal(f.calls.length, 0);
  });
}

test('a Stripe session that does not exist returns 404 without reading Redis', async t => {
  const f = fixture(t, { stripeStatus: 404 });
  const { response, data } = await f.get();
  assert.equal(response.status, 404);
  assert.deepEqual(data, { ok: false, error: 'Checkout session not found' });
  assert.equal(f.calls.length, 1);
});

test('unpaid sessions do not read stored fulfillment information', async t => {
  const f = fixture(t, { session: { payment_status: 'unpaid' }, order: { status: 'ready' } });
  const { response, data } = await f.get();
  assert.equal(response.status, 200);
  assert.deepEqual(data, { ok: true, testMode: true, paid: false, status: 'payment_pending' });
  assert.equal(f.calls.length, 1);
});

test('paid sessions wait for webhook persistence instead of inventing a ready order', async t => {
  const f = fixture(t);
  const { response, data } = await f.get();
  assert.equal(response.status, 200);
  assert.deepEqual(data, { ok: true, testMode: true, paid: true, status: 'processing' });
  assert.equal(f.calls.length, 2);
});

for (const status of ['validated', 'validation_failed', 'ready', 'unknown_future_state']) {
  test('the status endpoint preserves ' + status + ' for customer presentation', async t => {
    const f = fixture(t, { order: { status, fulfillmentStatus: status === 'validated' ? 'awaiting_fulfillment' : null, iso: 'DE', amount: 700, currency: 'eur' } });
    const { response, data } = await f.get();
    assert.equal(response.status, 200);
    assert.deepEqual(data, { ok: true, paid: true, testMode: true, status, fulfillmentStatus: status === 'validated' ? 'awaiting_fulfillment' : null, iso: 'DE', amount: 700, currency: 'eur' });
  });
}

test('live versus test mode is derived from Stripe, not the stored order', async t => {
  const f = fixture(t, { sessionId: 'cs_live_example', session: { livemode: true }, order: { status: 'validated', testMode: true, livemode: false } });
  const { response, data } = await f.get();
  assert.equal(response.status, 200);
  assert.equal(data.testMode, false);
});

test('a missing Stripe livemode field is not represented as a confirmed test order', async t => {
  const f = fixture(t, { session: { livemode: undefined }, order: { status: 'processing' } });
  const { data } = await f.get();
  assert.equal(data.testMode, false);
});

test('Stripe supplies amount and currency when older stored orders lack them', async t => {
  const f = fixture(t, { order: { status: 'processing' } });
  const { data } = await f.get();
  assert.equal(data.amount, 500);
  assert.equal(data.currency, 'usd');
});

test('a recorded zero amount is preserved instead of replaced with the Stripe fallback', async t => {
  const f = fixture(t, { order: { status: 'validated', amount: 0, currency: 'eur' } });
  const { data } = await f.get();
  assert.equal(data.amount, 0);
});

test('a stored order missing status requires review instead of automatic processing', async t => {
  const f = fixture(t, { order: { iso: 'DE' } });
  const { response, data } = await f.get();
  assert.equal(response.status, 200);
  assert.equal(data.status, 'unknown');
  assert.equal(orderPresentation(data).poll, false);
  assert.equal(orderPresentation(data).key, 'attention');
});

test('status JSON is an allowlist and never exposes private installation or customer data', async t => {
  const privateValue = 'private-installation-and-customer-value';
  const f = fixture(t, { order: {
    status: 'ready', iso: 'DE', amount: 500, currency: 'usd', fulfillmentStatus: 'ready',
    orderReference: privateValue, installDetails: { activationCode: privateValue, matchingId: privateValue, smdpAddress: privateValue, iccid: privateValue },
    email: privateValue, customer: { email: privateValue }, validationResult: { secret: privateValue }, apiKey: privateValue
  }, session: { customer_details: { email: privateValue }, metadata: { secret: privateValue } } });
  const { response, data } = await f.get();
  assert.equal(response.status, 200);
  assert.deepEqual(Object.keys(data).sort(), ['amount', 'currency', 'fulfillmentStatus', 'iso', 'ok', 'paid', 'status', 'testMode']);
  assert.equal(JSON.stringify(data).includes(privateValue), false);
});

for (const options of [{ redisError: true }, { redisStatus: 503 }, { redisMalformed: true }, { redisThrow: true }]) {
  test('Redis failure ' + JSON.stringify(options) + ' returns a sanitized error, never processing', async t => {
    const f = fixture(t, options);
    const { response, data } = await f.get();
    assert.equal(response.status, 500);
    assert.deepEqual(data, { ok: false, error: 'Could not load order' });
    assert.equal(JSON.stringify(data).includes('test-only-'), false);
  });
}

test('corrupt stored JSON reports an error instead of claiming an order state', async t => {
  const f = fixture(t, { stored: '{broken' });
  const { response, data } = await f.get();
  assert.equal(response.status, 500);
  assert.deepEqual(data, { ok: false, error: 'Invalid stored order' });
});

for (const stored of ['null', '[]', '42', 'true', '"not an order"']) {
  test('stored JSON of an invalid shape ' + stored + ' cannot look like a processing order', async t => {
    const f = fixture(t, { stored });
    const { response, data } = await f.get();
    assert.equal(response.status, 500);
    assert.equal(data.ok, false);
    assert.equal(data.status, undefined);
  });
}

for (const scenario of [
  { name: 'paid order', options: { order: { status: 'validated' } } },
  { name: 'unpaid order', options: { session: { payment_status: 'unpaid' } } },
  { name: 'invalid link', options: {}, sessionId: 'invalid' },
  { name: 'upstream failure', options: { redisError: true } }
]) {
  test('status response for ' + scenario.name + ' explicitly prevents caching', async t => {
    const f = fixture(t, scenario.options);
    const { response } = await f.get(scenario.sessionId);
    assert.match(response.headers.get('Cache-Control') || '', /(?:^|,)\s*no-store\s*(?:,|$)/);
  });
}

test('a Stripe network error does not leak the thrown secret or request Redis', async t => {
  const f = fixture(t, { stripeThrow: true });
  const { response, data } = await f.get();
  assert.equal(response.status, 500);
  assert.deepEqual(data, { ok: false, error: 'Could not load order' });
  assert.equal(f.calls.length, 1);
});

test('missing server configuration returns a generic error without external requests', async t => {
  const f = fixture(t);
  delete process.env.STRIPE_SECRET_KEY;
  const { response, data } = await f.get();
  assert.equal(response.status, 500);
  assert.deepEqual(data, { ok: false, error: 'Could not load order' });
  assert.equal(f.calls.length, 0);
});
