import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const moduleUrl = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const config = moduleUrl(`export function getAuthConfig() { return {url:'https://project.supabase.co',key:'public-test-key'}; }`);
const providers = await import(moduleUrl((await readFile(new URL('../lib/auth/providers.js', import.meta.url), 'utf8'))
  .replace("import 'server-only';", '')
  .replace("'./config.mjs'", JSON.stringify(config))));

test('provider settings allow only explicitly enabled providers and fail closed', async t => {
  const original = globalThis.fetch;
  t.after(() => { globalThis.fetch = original; });
  let calls = 0;
  globalThis.fetch = async (url, options) => {
    calls++;
    assert.equal(url, 'https://project.supabase.co/auth/v1/settings');
    assert.equal(options.headers.apikey, 'public-test-key');
    assert.equal(options.cache, 'no-store');
    return new Response(JSON.stringify({ external: { google: true, apple: false } }));
  };
  assert.equal(await providers.isOAuthProviderEnabled('google'), true);
  assert.equal(await providers.isOAuthProviderEnabled('apple'), false);
  assert.equal(await providers.isOAuthProviderEnabled('attacker'), false);
  assert.equal(calls, 2);
  for (const response of [() => new Response('unavailable', {status:503}), () => new Response('bad-json'), () => { throw new Error('offline'); }]) {
    globalThis.fetch = async () => response();
    assert.equal(await providers.isOAuthProviderEnabled('google'), false);
  }
});

test('logout removes chunked auth/verifier cookies while preserving unrelated cookies', async () => {
  const writes = [];
  globalThis.__authCookieFixture = {
    getAll: () => ['sb-project-auth-token', 'sb-project-auth-token.0', 'sb-project-auth-token.1', 'sb-project-auth-token-code-verifier', 'sb-other-auth-token', 'cart', 'consent'].map(name => ({name,value:'test'})),
    set: (...args) => writes.push(args)
  };
  try {
    const headers = moduleUrl(`export function cookies() { return globalThis.__authCookieFixture; }`);
    const sdk = moduleUrl(`export function createServerClient() { throw new Error('not needed for cleanup'); }`);
    const source = (await readFile(new URL('../lib/supabase/server.js', import.meta.url), 'utf8'))
      .replace("import 'server-only';", '')
      .replace("'next/headers'", JSON.stringify(headers))
      .replace("'@supabase/ssr'", JSON.stringify(sdk))
      .replace("'../auth/config.mjs'", JSON.stringify(config));
    const {clearAuthCookies} = await import(moduleUrl(source));
    clearAuthCookies();
    assert.deepEqual(writes.map(w => w[0]), ['sb-project-auth-token','sb-project-auth-token.0','sb-project-auth-token.1','sb-project-auth-token-code-verifier']);
    for (const [,value,options] of writes) { assert.equal(value,''); assert.equal(options.maxAge,0); assert.equal(options.path,'/'); }
  } finally { delete globalThis.__authCookieFixture; }
});
