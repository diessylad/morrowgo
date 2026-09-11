import 'server-only';
import { createAdminSupabaseClient } from '../supabase/admin';

const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

// Caller must first verify the Stripe signature and accepted payment event.
export async function syncPaidCustomerOrder(session, eventCreated) {
  const owner = session?.metadata?.morrowgo_user_id;
  // Existing guest sessions do not depend on privileged Supabase configuration.
  if (owner === undefined || owner === null || owner === '') return null;
  if (!uuid(owner)) throw new Error('Invalid account order metadata');
  const sessionId = session?.id;
  const iso = String(session?.metadata?.iso || '').toUpperCase();
  const amount = session?.amount_total;
  const currency = String(session?.currency || '').toUpperCase();
  if (typeof sessionId !== 'string' || sessionId.length > 255 || !/^cs_(test_|live_)?[A-Za-z0-9_]+$/.test(sessionId) ||
      !/^[A-Z]{2}$/.test(iso) || !Number.isSafeInteger(amount) || amount < 0 || !/^[A-Z]{3}$/.test(currency) ||
      (session.mode !== undefined && session.mode !== 'payment')) {
    throw new Error('Invalid paid account order');
  }
  const timestamp = session.created ?? eventCreated ?? Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(timestamp) || timestamp < 0 || timestamp > Math.floor(Date.now() / 1000) + 86400) {
    throw new Error('Invalid account order timestamp');
  }
  const label = session.metadata.morrowgo_plan_name;
  const planName = typeof label === 'string' && label.trim() ? label.trim().slice(0, 500) : `MORROWGO ${iso} eSIM`;
  const client = createAdminSupabaseClient();
  const { data, error } = await client.rpc('record_paid_customer_order', {
    p_stripe_session_id: sessionId,
    p_user_id: owner.toLowerCase(),
    p_destination_iso: iso,
    p_plan_name: planName,
    p_amount_total: amount,
    p_currency: currency,
    p_ordered_at: new Date(timestamp * 1000).toISOString()
  });
  // Never return or log raw upstream error details (which may include data).
  if (error || !uuid(data)) throw new Error('Account order storage failed');
  return data;
}
