import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getAuthConfig } from '../auth/config.mjs';

export function createServerSupabaseClient() {
  const config = getAuthConfig();
  if (!config) return null;
  const cookieStore = cookies();
  return createServerClient(config.url, config.key, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(values) {
        try { values.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); }
        catch { /* Server components cannot set cookies; middleware refreshes them. */ }
      }
    }
  });
}

// Sign-out must clear this browser even when the Auth service cannot revoke a token.
// Only this project's default SSR cookies are removed; unrelated cookies stay intact.
export function clearAuthCookies() {
  const config = getAuthConfig();
  if (!config) return;
  const prefix = `sb-${new URL(config.url).hostname.split('.')[0]}-auth-token`;
  const store = cookies();
  for (const { name } of store.getAll()) {
    if (name === prefix || name.startsWith(`${prefix}.`) || name.startsWith(`${prefix}-`)) {
      store.set(name, '', { path: '/', maxAge: 0, sameSite: 'lax' });
    }
  }
}
