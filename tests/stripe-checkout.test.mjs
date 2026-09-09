import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../app/api/stripe/checkout/route.js', import.meta.url), 'utf8');
const { POST } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
const privateValue = 'test-only-private-stripe-value';

function fixture(t, options = {}) {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.STRIPE_SECRET_KEY;
  process.env.STRIPE_SECRET_KEY = privateValue;
  t.after(() => {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = originalKey;
  });
  const calls = [];
  const plan = { id: 'plan-example', price: 4.99, country: 'Germany', dataGB: 1, duration: 7, ...options.plan };
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), init });
    assert.equal(init.cache, 'no-store');
    if (String(url) === 'https://morrowgo.test/api/esimgo/catalogue?country=DE') {
      if (options.catalogueThrow) throw new Error(privateValue);
      return Response.json({ ok: true, packages: [plan] });
    }
    if (String(url) === 'https://api.stripe.com/v1/checkout/sessions') {
      assert.equal(init.method, 'POST');
      assert.equal(init.headers.Authorization, 'Bearer ' + privateValue);
      if (options.stripeThrow) throw new Error(privateValue);
      if (options.stripeMalformed) return new Response(privateValue);
      if (options.stripeError) return Response.json({ error: { message: privateValue, code: privateValue } }, { status: 400 });
      return Response.json({ url: 'https://checkout.stripe.test/example', id: 'cs_test_example', client_secret: privateValue, api_key: privateValue, metadata: { internal: privateValue } });
    }
    assert.fail('Unexpected external request: ' + String(url));
  };
  async function send(body = { iso: 'DE', plan: plan.id }) {
    const response = await POST(new Request('https://morrowgo.test/api/stripe/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
    return { response, data: await response.json() };
  }
  function stripeParams() {
    const request = calls.find(call => call.url === 'https://api.stripe.com/v1/checkout/sessions');
    assert.ok(request, 'Stripe request was made');
    return new URLSearchParams(request.init.body);
  }
  return { calls, send, stripeParams };
}

test('cancel URL returns to the selected country and plan with canceled=true', async t => {
  const planId = 'plan + & / ? # example';
  const f = fixture(t, { plan: { id: planId } });
  const { response } = await f.send({ iso: ' de ', plan: planId });
  assert.equal(response.status, 200);
  const params = f.stripeParams();
  const cancel = new URL(params.get('cancel_url'));
  assert.equal(cancel.origin, 'https://morrowgo.test');
  assert.equal(cancel.pathname, '/checkout');
  assert.equal(cancel.searchParams.get('iso'), 'DE');
  assert.equal(cancel.searchParams.get('plan'), planId);
  assert.equal(cancel.searchParams.get('canceled'), 'true');
  assert.equal(cancel.hash, '');
  assert.equal(params.get('success_url'), 'https://morrowgo.test/checkout/success?session_id={CHECKOUT_SESSION_ID}');
});

test('successful checkout exposes only the redirect URL, never Stripe secrets or metadata', async t => {
  const f = fixture(t);
  const { response, data } = await f.send();
  assert.equal(response.status, 200);
  assert.deepEqual(data, { ok: true, url: 'https://checkout.stripe.test/example' });
  assert.equal(JSON.stringify(data).includes(privateValue), false);
});

test('checkout charges the verified catalogue price and ignores browser price overrides', async t => {
  const f = fixture(t);
  const { response } = await f.send({ iso: 'DE', plan: 'plan-example', price: 0.01, amount: 1, currency: 'eur' });
  assert.equal(response.status, 200);
  const params = f.stripeParams();
  assert.equal(params.get('line_items[0][price_data][unit_amount]'), '499');
  assert.equal(params.get('line_items[0][price_data][currency]'), 'usd');
  assert.equal(params.get('metadata[iso]'), 'DE');
  assert.equal(params.get('metadata[plan_id]'), 'plan-example');
});

for (const options of [{ stripeError: true }, { stripeMalformed: true }]) {
  test('Stripe failure ' + JSON.stringify(options) + ' returns a generic error without raw upstream data', async t => {
    const f = fixture(t, options);
    const { response, data } = await f.send();
    assert.equal(response.status, 502);
    assert.deepEqual(data, { ok: false, error: 'Stripe could not create checkout session' });
    assert.equal(JSON.stringify(data).includes(privateValue), false);
  });
}

for (const options of [{ stripeThrow: true }, { catalogueThrow: true }]) {
  test('thrown error ' + JSON.stringify(options) + ' cannot expose a secret through the response', async t => {
    const f = fixture(t, options);
    const { response, data } = await f.send();
    assert.equal(response.status, 500);
    assert.deepEqual(data, { ok: false, error: 'Could not create checkout' });
    assert.equal(JSON.stringify(data).includes(privateValue), false);
  });
}

test('invalid country is rejected before any provider call', async t => {
  const f = fixture(t);
  const { response, data } = await f.send({ iso: 'invalid', plan: 'plan-example' });
  assert.equal(response.status, 400);
  assert.deepEqual(data, { ok: false, error: 'Invalid checkout request' });
  assert.equal(f.calls.length, 0);
});
