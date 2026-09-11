import test from 'node:test';
import assert from 'node:assert/strict';
import { getAuthConfig, safeAccountPath, siteOrigin, validEmail, validPassword, validRecoveryToken } from '../lib/auth/config.mjs';

test('auth remains unavailable without both public credentials', () => {
  assert.equal(getAuthConfig({}), null);
  assert.equal(getAuthConfig({ NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co' }), null);
  assert.equal(getAuthConfig({ NEXT_PUBLIC_SUPABASE_URL: 'javascript:alert(1)', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-test' }), null);
});
test('auth accepts HTTPS, local development and legacy anon keys', () => {
  assert.deepEqual(getAuthConfig({ NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co/', NEXT_PUBLIC_SUPABASE_ANON_KEY: 'public-test' }), { url: 'https://example.supabase.co', key: 'public-test' });
  assert.equal(getAuthConfig({ NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:3030', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-test' }).url, 'http://127.0.0.1:3030');
  assert.equal(getAuthConfig({ NEXT_PUBLIC_SUPABASE_URL: 'http://evil.example', NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'public-test' }), null);
});
test('post-auth redirects cannot escape protected account paths', () => {
  for (const value of ['https://evil.example', '//evil.example', '/\\evil', '/account/../api', '/account?next=https://evil.example', '/accounting', '/reset-password', ['account'], null]) assert.equal(safeAccountPath(value), '/account');
  assert.equal(safeAccountPath('/account/esims'), '/account/esims');
});
test('email redirect origin ignores invalid protocol and embedded credentials', () => {
  assert.equal(siteOrigin({ NEXT_PUBLIC_SITE_URL: 'https://a:b@evil.example' }), 'https://www.morrowgo.com');
  assert.equal(siteOrigin({ NEXT_PUBLIC_SITE_URL: 'http://127.0.0.1:3019' }), 'http://127.0.0.1:3019');
});
test('password length respects UTF-8 byte limit; credentials and recovery inputs bounded', () => {
  assert.equal(validEmail('traveller@example.test'), true);
  assert.equal(validEmail('x\n@example.test'), false);
  assert.equal(validPassword('short'), false);
  assert.equal(validPassword('Morrowgo-test-password-123'), true);
  assert.equal(validPassword('é'.repeat(37)), false);
  assert.equal(validRecoveryToken('local-test-confirmation'), true);
  assert.equal(validRecoveryToken('x'), false);
  assert.equal(validRecoveryToken('<script>oops</script>'), false);
});
