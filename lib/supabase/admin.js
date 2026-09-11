import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Never use a request-cookie client for privileged webhook writes.
export function createAdminSupabaseClient() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!rawUrl || !key) throw new Error('Account order storage is not configured');
  const url = new URL(rawUrl);
  const local = ['localhost', '127.0.0.1'].includes(url.hostname);
  if (url.username || url.password || (url.protocol !== 'https:' && !(local && url.protocol === 'http:'))) {
    throw new Error('Invalid account storage configuration');
  }
  return createClient(url.origin, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store', signal: AbortSignal.timeout(8000) })
    }
  });
}
