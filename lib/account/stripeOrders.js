import 'server-only';
import { createAdminSupabaseClient } from '../supabase/admin';

const uuid = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

function safeErrorText(value) {
  if (typeof value !== 'string' || !value) return null;
  if (value.length > 8192) return '[oversized upstream message omitted]';
  value = value.split(/[\r\n]/, 1)[0] // No PostgreSQL DETAIL, stack or cause-stack lines.
    .replace(/<[^>]*>[\s\S]*/g, '[upstream HTML omitted]')
    .replace(/[\[{][\s\S]*/g, '[payload omitted]')
    .replace(/\b(?:DETAIL|CONTEXT):.*$|\bFailing row contains\s*\(.*$|\bKey\s*\([^)]*\)\s*=.*$/i, '[database detail omitted]');
  // Redact configured credentials even if the upstream error reflects them.
  for (const [name, secret] of Object.entries(process.env)) {
    if (!/(KEY|SECRET|TOKEN|PASSWORD|DATABASE_URL|REDIS_URL)/i.test(name) || !secret) continue;
    for (const token of [secret, encodeURIComponent(secret)]) {
      value = value.split(token).join('[redacted]');
    }
  }
  return value
    .replace(/\b(?:authorization|cookie|set-cookie|[\w-]*(?:token|secret|password|api[_-]?key))\s*[=:]\s*.*|\bBearer\s+\S+/gi, '[credentials omitted]')
    .replace(/https?:\/\/[^\s"'<>]+/gi, '[url omitted]')
    .replace(/\b(?:sb_(?:secret|publishable)_|(?:sk|pk|rk)_(?:live|test)_|whsec_|cs_|cus_|pi_|pm_|evt_)[A-Za-z0-9_-]+/g, '[redacted]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?/g, '[redacted]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '[id omitted]')
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[email omitted]')
    .replace(/"[^"\r\n]*"|'[^'\r\n]*'|`[^`\r\n]*`/g, '[quoted value omitted]')
    .replace(/[A-Za-z0-9_+\/-]{40,}={0,2}/g, '[opaque value omitted]')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .slice(0, 500);
}

function syncError(cause, stage, status, message = 'Account order storage failed') {
  return Object.assign(new Error(message, { cause }), { syncStage: stage, httpStatus: status });
}

// Only this allowlisted object goes to server logs. Never log the Error itself,
// raw error.details/hint, RPC arguments, request headers, or the Stripe session.
export function getCustomerOrderSyncDiagnostic(error) {
  const source = error?.cause ?? error;
  const code = safeErrorText(source?.code);
  return {
    message: safeErrorText(source?.message) || 'Unknown account order sync error',
    code: code && /^[A-Za-z0-9_]{1,48}$/.test(code) ? code : null,
    details: {
      stage: ['configuration', 'rpc', 'response'].includes(error?.syncStage) ? error.syncStage : 'validation',
      httpStatus: Number.isInteger(error?.httpStatus) && error.httpStatus >= 0 && error.httpStatus <= 599 ? error.httpStatus : null,
      operation: 'record_paid_customer_order',
      supabaseUrlConfigured: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      serverKeyConfigured: Boolean(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
    }
  };
}

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
  let client;
  try {
    client = createAdminSupabaseClient();
  } catch (error) {
    throw syncError(error, 'configuration', undefined, 'Account order storage is not configured');
  }
  let result;
  try {
    result = await client.rpc('record_paid_customer_order', {
      p_stripe_session_id: sessionId,
      p_user_id: owner.toLowerCase(),
      p_destination_iso: iso,
      p_plan_name: planName,
      p_amount_total: amount,
      p_currency: currency,
      p_ordered_at: new Date(timestamp * 1000).toISOString()
    });
  } catch (error) {
    throw syncError(error, 'rpc');
  }
  const { data, error, status } = result || {};
  if (error) throw syncError(error, 'rpc', status);
  if (!uuid(data)) {
    throw syncError({ message: 'Invalid response from account order RPC', code: 'INVALID_RPC_RESPONSE' }, 'response', status);
  }
  return data;
}
