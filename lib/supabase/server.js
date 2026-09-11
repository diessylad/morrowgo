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
