import { getVerifiedAccount } from '../auth/session';

export function accountJson(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
}

export async function verifiedApiAccount() {
  try {
    const account = await getVerifiedAccount();
    if (!account.configured) return { response: accountJson({ error: 'account_not_configured' }, 503) };
    if (!account.user) return { response: accountJson({ error: 'authentication_required' }, 401) };
    if (account.error || !account.client) return { response: accountJson({ error: 'account_unavailable' }, 503) };
    return account;
  } catch {
    return { response: accountJson({ error: 'account_unavailable' }, 503) };
  }
}
