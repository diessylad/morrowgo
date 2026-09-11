import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';

const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const actionSource = await readFile(new URL('../lib/auth/actions.js', import.meta.url), 'utf8');
const sessionSource = await readFile(new URL('../lib/auth/session.js', import.meta.url), 'utf8');
const configUrl = moduleUrl(await readFile(new URL('../lib/auth/config.mjs', import.meta.url), 'utf8'));
const redirectUrl = moduleUrl(`export function redirect(location) { const error = new Error('TEST_REDIRECT'); error.location = location; throw error; }`);
const verifiedUser = { id: 'test-customer-a', email: 'customer@example.test', email_confirmed_at: '2026-09-01T12:00:00Z' };
const password = 'Test-Only-Password-2026';
const tokenHash = 'test_only_recovery_hash_1234567890';

function form(values = {}) {
  const data = new FormData();
  for (const [name, value] of Object.entries(values)) data.set(name, value);
  return data;
}

async function fixture(t, overrides = {}, configured = true) {
  const calls = [];
  const defaults = {
    getUser: { data: { user: verifiedUser }, error: null },
    signInWithPassword: { data: { user: verifiedUser }, error: null },
    signUp: { data: { user: null, session: null }, error: null },
    resetPasswordForEmail: { data: {}, error: null },
    verifyOtp: { data: { user: verifiedUser }, error: null },
    updateUser: { data: { user: verifiedUser }, error: null },
    signOut: { error: null }
  };
  const client = { auth: Object.fromEntries(Object.keys(defaults).map(name => [name, async (...args) => {
    calls.push({ name, args });
    const response = Object.hasOwn(overrides, name) ? overrides[name] : defaults[name];
    if (response instanceof Error) throw response;
    return response;
  }])) };
  const key = `__morrowgoAuthTest_${randomUUID()}`;
  globalThis[key] = configured ? client : null;
  t.after(() => { delete globalThis[key]; });
  const serverUrl = moduleUrl(`export function createServerSupabaseClient() { return globalThis[${JSON.stringify(key)}]; }`);
  const actions = await import(moduleUrl(actionSource
    .replace("'next/navigation'", JSON.stringify(redirectUrl))
    .replace("'../supabase/server'", JSON.stringify(serverUrl))
    .replace("'./config.mjs'", JSON.stringify(configUrl))));
  const session = await import(moduleUrl(sessionSource
    .replace("import 'server-only';", '')
    .replace("'next/navigation'", JSON.stringify(redirectUrl))
    .replace("'../supabase/server'", JSON.stringify(serverUrl))
    .replace("'./config.mjs'", JSON.stringify(configUrl))));
  return { actions, session, calls, client };
}

async function redirected(promise, location) {
  await assert.rejects(promise, error => error.message === 'TEST_REDIRECT' && error.location === location);
}

test('unconfigured authentication never calls a backend or grants account access', async t => {
  const f = await fixture(t, {}, false);
  assert.deepEqual(await f.session.getVerifiedAccount(), { client: null, user: null, configured: false, error: null });
  await redirected(f.session.requireAccount('/account/esims'), '/login?next=%2Faccount%2Fesims');
  for (const action of ['loginAction', 'registerAction', 'forgotPasswordAction', 'resetPasswordAction']) {
    assert.ok((await f.actions[action]({}, form())).error);
  }
  assert.deepEqual(f.calls, []);
});

test('account authorization obtains the user from Supabase and returns only a verified user', async t => {
  const f = await fixture(t);
  const result = await f.session.requireAccount('/account/orders');
  assert.equal(result.user.id, verifiedUser.id);
  assert.equal(result.client, f.client);
  assert.deepEqual(f.calls.map(call => call.name), ['getUser']);
});

for (const [description, result] of [
  ['missing user', { data: { user: null }, error: null }],
  ['unverified email', { data: { user: { ...verifiedUser, email_confirmed_at: null } }, error: null }],
  ['invalid session', { data: { user: verifiedUser }, error: { message: 'test-private-auth-detail' } }]
]) {
  test(`protected account rejects ${description}`, async t => {
    const f = await fixture(t, { getUser: result });
    assert.equal((await f.session.getVerifiedAccount()).user, null);
    await redirected(f.session.requireAccount('https://outside.example/'), '/login?next=%2Faccount');
  });
}

test('authentication service failure fails closed without exposing its error text', async t => {
  const f = await fixture(t, { getUser: new Error('test-private-auth-detail') });
  const result = await f.session.getVerifiedAccount();
  assert.equal(result.user, null);
  assert.equal(result.error, 'unavailable');
  await redirected(f.session.requireAccount('/account'), '/login?next=%2Faccount');
});

test('invalid login input cannot trigger authentication', async t => {
  const f = await fixture(t);
  assert.ok((await f.actions.loginAction({}, form({ email: 'invalid', password }))).error);
  assert.deepEqual(f.calls, []);
});

for (const [description, result] of [
  ['unverified account', { data: { user: { ...verifiedUser, email_confirmed_at: null } }, error: null }],
  ['rejected credentials', { data: { user: null }, error: { message: 'test-private-auth-detail' } }],
  ['unavailable service', new Error('test-private-auth-detail')]
]) {
  test(`login rejects ${description} without redirect or private error`, async t => {
    const f = await fixture(t, { signInWithPassword: result });
    const response = await f.actions.loginAction({}, form({ email: verifiedUser.email, password, next: '/account/esims' }));
    assert.ok(response.error);
    assert.equal(JSON.stringify(response).includes('test-private-auth-detail'), false);
    assert.deepEqual(f.calls.map(call => call.name), ['signInWithPassword']);
  });
}

for (const [next, expected] of [['/account/esims', '/account/esims'], ['//outside.example', '/account'], ['https://outside.example', '/account'], ['/account\\outside', '/account']]) {
  test(`verified login safely handles destination ${JSON.stringify(next)}`, async t => {
    const f = await fixture(t);
    await redirected(f.actions.loginAction({}, form({ email: verifiedUser.email, password, next })), expected);
  });
}

test('registration refuses weak passwords without creating an account', async t => {
  const f = await fixture(t);
  assert.ok((await f.actions.registerAction({}, form({ email: verifiedUser.email, password: 'short' }))).error);
  assert.deepEqual(f.calls, []);
});

test('registration uses Supabase signup and directs the customer to verify email', async t => {
  const f = await fixture(t);
  const result = await f.actions.registerAction({}, form({ email: verifiedUser.email, password }));
  assert.match(result.success, /confirmation link/i);
  assert.deepEqual(f.calls.map(call => call.name), ['signUp']);
  const destination = new URL(f.calls[0].args[0].options.emailRedirectTo);
  assert.equal(destination.pathname, '/auth/callback');
  assert.equal(f.calls[0].args[0].email, verifiedUser.email);
});

test('forgot password gives the same answer for accepted and rejected requests', async t => {
  const accepted = await fixture(t);
  const rejected = await fixture(t, { resetPasswordForEmail: { error: { message: 'unknown email' } } });
  const failed = await fixture(t, { resetPasswordForEmail: new Error('test-private-auth-detail') });
  const values = { email: verifiedUser.email };
  const response = await accepted.actions.forgotPasswordAction({}, form(values));
  assert.deepEqual(await rejected.actions.forgotPasswordAction({}, form(values)), response);
  assert.deepEqual(await failed.actions.forgotPasswordAction({}, form(values)), response);
  assert.match(response.success, /^If this email has an account/);
});

for (const token of ['', 'invalid', 'https://outside.example/reset']) {
  test(`password reset without a valid recovery token cannot verify or update ${JSON.stringify(token)}`, async t => {
    const f = await fixture(t);
    assert.ok((await f.actions.resetPasswordAction({}, form({ password, confirmPassword: password, token_hash: token }))).error);
    assert.deepEqual(f.calls, []);
  });
}

test('password mismatch is rejected before consuming the single-use recovery token', async t => {
  const f = await fixture(t);
  assert.ok((await f.actions.resetPasswordAction({}, form({ password, confirmPassword: 'Different-Password-2026', token_hash: tokenHash }))).error);
  assert.deepEqual(f.calls, []);
});

test('a rejected recovery OTP can never update a password, even with an existing user session', async t => {
  const f = await fixture(t, { verifyOtp: { error: { message: 'test-private-auth-detail' } } });
  const result = await f.actions.resetPasswordAction({}, form({ password, confirmPassword: password, token_hash: tokenHash }));
  assert.ok(result.error);
  assert.deepEqual(f.calls.map(call => call.name), ['verifyOtp']);
  assert.equal(JSON.stringify(result).includes('test-private-auth-detail'), false);
});

test('recovery requires a server-verified user before password update', async t => {
  const f = await fixture(t, { getUser: { data: { user: null }, error: { message: 'no verified session' } } });
  assert.ok((await f.actions.resetPasswordAction({}, form({ password, confirmPassword: password, token_hash: tokenHash }))).error);
  assert.deepEqual(f.calls.map(call => call.name), ['verifyOtp', 'getUser']);
});

test('valid recovery verifies the one-time token before update and then revokes refresh sessions', async t => {
  const f = await fixture(t);
  await redirected(f.actions.resetPasswordAction({}, form({ password, confirmPassword: password, token_hash: tokenHash })), '/login?message=password-updated');
  assert.deepEqual(f.calls.map(call => call.name), ['verifyOtp', 'getUser', 'updateUser', 'signOut']);
  assert.deepEqual(f.calls[0].args[0], { token_hash: tokenHash, type: 'recovery' });
  assert.deepEqual(f.calls[2].args[0], { password });
  assert.deepEqual(f.calls[3].args[0], { scope: 'global' });
});

test('failed password update does not report a successful password change', async t => {
  const f = await fixture(t, { updateUser: { error: { message: 'test-private-auth-detail' } } });
  const result = await f.actions.resetPasswordAction({}, form({ password, confirmPassword: password, token_hash: tokenHash }));
  assert.ok(result.error);
  assert.equal(JSON.stringify(result).includes('test-private-auth-detail'), false);
  assert.deepEqual(f.calls.map(call => call.name), ['verifyOtp', 'getUser', 'updateUser']);
});

test('logout ends the current Supabase session and redirects to sign in', async t => {
  const f = await fixture(t);
  await redirected(f.actions.logoutAction(), '/login');
  assert.deepEqual(f.calls.map(call => call.name), ['signOut']);
  assert.deepEqual(f.calls[0].args[0], { scope: 'local' });
});

test('logout without configured authentication returns safely to sign in', async t => {
  const f = await fixture(t, {}, false);
  await redirected(f.actions.logoutAction(), '/login');
  assert.deepEqual(f.calls, []);
});
