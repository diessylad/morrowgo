import 'server-only';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '../supabase/server';
import { safeAccountPath } from './config.mjs';

export async function getVerifiedAccount() {
  const client = createServerSupabaseClient();
  if (!client) return { client: null, user: null, configured: false, error: null };
  try {
    const { data, error } = await client.auth.getUser();
    const user = !error && data?.user?.email_confirmed_at ? data.user : null;
    return { client, user, configured: true, error: error || null };
  } catch { return { client, user: null, configured: true, error: 'unavailable' }; }
}

export async function requireAccount(next = '/account') {
  const result = await getVerifiedAccount();
  if (!result.user) redirect(`/login?next=${encodeURIComponent(safeAccountPath(next))}`);
  return result;
}
