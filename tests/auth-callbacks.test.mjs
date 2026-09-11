import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const callbackSource = await readFile(new URL('../app/auth/callback/route.js', import.meta.url), 'utf8');
const confirmSource = await readFile(new URL('../app/auth/confirm/route.js', import.meta.url), 'utf8');
const configUrl = moduleUrl(await readFile(new URL('../lib/auth/config.mjs', import.meta.url), 'utf8'));
const nextResponseUrl = moduleUrl(`export const NextResponse = { redirect(url) { return new Response(null, { status: 307, headers: { Location: String(url) } }); } };`);
const tokenHash = 'test_only_recovery_hash_1234567890';
const configuredOrigin = 'https://accounts.morrowgo.test';

async function fixture(t, options = {}) {
  const calls = [];
  const oldOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  process.env.NEXT_PUBLIC_SITE_URL = options.siteOrigin || configuredOrigin;
  const client = { auth: Object.fromEntries(['verifyOtp', 'exchangeCodeForSession'].map(name => [name, async (...args) => {
    calls.push({ name, args });
    const result = Object.hasOwn(options, name) ? options[name] : { error: null };
    if (result instanceof Error) throw result;
    return result;
  }])) };
  const key = `__morrowgoCallbackTest_${randomUUID()}`;
  globalThis[key] = options.configured === false ? null : client;
  t.after(() => {
    delete globalThis[key];
    if (oldOrigin === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
    else process.env.NEXT_PUBLIC_SITE_URL = oldOrigin;
  });
  const serverUrl = moduleUrl(`export function createServerSupabaseClient() { return globalThis[${JSON.stringify(key)}]; }`);
  const load = source => import(moduleUrl(source
    .replace("'next/server'", JSON.stringify(nextResponseUrl))
    .replace("'../../../lib/supabase/server'", JSON.stringify(serverUrl))
    .replace("'../../../lib/auth/config.mjs'", JSON.stringify(configUrl))));
  const callback = await load(callbackSource);
  const confirm = await load(confirmSource);
  async function request(route, params, requestOrigin = 'https://untrusted-request.example') {
    const url = new URL(`/auth/${route}`, requestOrigin);
    for (const [name, value] of Object.entries(params)) if (value !== null) url.searchParams.set(name, value);
    const response = await (route === 'confirm' ? confirm.GET : callback.GET)(new Request(url));
    assert.equal(response.status, 307);
    assert.equal(response.headers.get('Cache-Control'), 'private, no-store');
    assert.equal(response.headers.get('Referrer-Policy'), 'no-referrer');
    return response.headers.get('Location');
  }
  return { calls, request };
}

test('recovery GET preserves the one-time token without consuming it or authenticating', async t => {
  const f = await fixture(t);
  const destination = await f.request('confirm', { type: 'recovery', token_hash: tokenHash, next: 'https://outside.example' });
  assert.equal(destination, `${configuredOrigin}/reset-password?token_hash=${tokenHash}`);
  assert.deepEqual(f.calls, []);
});

test('recovery redirects to configured 127.0.0.1 origin even when Next request URL says localhost', async t => {
  const f = await fixture(t, { siteOrigin: 'http://127.0.0.1:3017' });
  const destination = await f.request('confirm', { type: 'recovery', token_hash: tokenHash }, 'http://localhost:3017');
  assert.equal(destination, `http://127.0.0.1:3017/reset-password?token_hash=${tokenHash}`);
  assert.deepEqual(f.calls, []);
});

for (const token of [null, '', 'too-short', 'https://outside.example/token', 'not a valid recovery token']) {
  test(`invalid confirmation token ${JSON.stringify(token)} fails without authentication calls`, async t => {
    const f = await fixture(t);
    const destination = await f.request('confirm', { type: 'recovery', token_hash: token });
    assert.equal(destination, `${configuredOrigin}/login?message=link-invalid`);
    assert.deepEqual(f.calls, []);
  });
}

test('unsupported confirmation type cannot verify a valid-looking token', async t => {
  const f = await fixture(t);
  assert.equal(await f.request('confirm', { type: 'arbitrary', token_hash: tokenHash }), `${configuredOrigin}/login?message=link-invalid`);
  assert.deepEqual(f.calls, []);
});

test('signup confirmation verifies the exact token type before returning to the selected account page', async t => {
  const f = await fixture(t);
  assert.equal(await f.request('confirm', { type: 'signup', token_hash: tokenHash, next: '/account/esims' }), `${configuredOrigin}/account/esims`);
  assert.deepEqual(f.calls, [{ name: 'verifyOtp', args: [{ token_hash: tokenHash, type: 'signup' }] }]);
});

for (const next of ['https://outside.example/steal', '//outside.example', '/account\\outside.example', '/account?next=https://outside.example']) {
  test(`signup confirmation blocks unsafe next destination ${JSON.stringify(next)}`, async t => {
    const f = await fixture(t);
    assert.equal(await f.request('confirm', { type: 'signup', token_hash: tokenHash, next }), `${configuredOrigin}/account`);
    assert.equal(f.calls.length, 1);
  });
}

test('failed signup OTP redirects generically without exposing the backend error or token', async t => {
  const f = await fixture(t, { verifyOtp: { error: { message: 'test-private-auth-detail' } } });
  const destination = await f.request('confirm', { type: 'signup', token_hash: tokenHash });
  assert.equal(destination, `${configuredOrigin}/login?message=link-invalid`);
  assert.equal(destination.includes(tokenHash), false);
  assert.equal(destination.includes('test-private-auth-detail'), false);
});

test('confirmation without configured authentication cannot authorize signup', async t => {
  const f = await fixture(t, { configured: false });
  assert.equal(await f.request('confirm', { type: 'signup', token_hash: tokenHash }), `${configuredOrigin}/login?message=link-invalid`);
  assert.deepEqual(f.calls, []);
});

test('PKCE callback uses configured site origin and an account-only next path despite attacker request host', async t => {
  const f = await fixture(t);
  assert.equal(await f.request('callback', { code: 'test-only-pkce-code', next: '/account/orders' }, 'https://attacker.example'), `${configuredOrigin}/account/orders`);
  assert.deepEqual(f.calls, [{ name: 'exchangeCodeForSession', args: ['test-only-pkce-code'] }]);
});

test('PKCE callback cannot redirect to an external next value after a valid code', async t => {
  const f = await fixture(t);
  assert.equal(await f.request('callback', { code: 'test-only-pkce-code', next: 'https://attacker.example' }), `${configuredOrigin}/account`);
});

for (const result of [{ error: { message: 'test-private-auth-detail' } }, new Error('test-private-auth-detail')]) {
  test(`PKCE callback fails closed on ${result instanceof Error ? 'a thrown error' : 'a rejected code'}`, async t => {
    const f = await fixture(t, { exchangeCodeForSession: result });
    const destination = await f.request('callback', { code: 'test-only-pkce-code', next: '/account' });
    assert.equal(destination, `${configuredOrigin}/login?message=link-invalid`);
    assert.equal(destination.includes('test-only-pkce-code'), false);
    assert.equal(destination.includes('test-private-auth-detail'), false);
  });
}

test('missing and oversized PKCE codes never reach the auth backend', async t => {
  const f = await fixture(t);
  for (const code of [null, '', 'x'.repeat(2048)]) {
    assert.equal(await f.request('callback', { code }), `${configuredOrigin}/login?message=link-invalid`);
  }
  assert.deepEqual(f.calls, []);
});

test('PKCE callback without configured authentication fails closed', async t => {
  const f = await fixture(t, { configured: false });
  assert.equal(await f.request('callback', { code: 'test-only-pkce-code' }), `${configuredOrigin}/login?message=link-invalid`);
  assert.deepEqual(f.calls, []);
});

test('invalid configured origin falls back to MORROWGO, never to the untrusted request host', async t => {
  const f = await fixture(t, { siteOrigin: 'javascript:alert(1)' });
  assert.equal(await f.request('callback', { code: 'test-only-pkce-code' }, 'https://attacker.example'), 'https://www.morrowgo.com/account');
});
