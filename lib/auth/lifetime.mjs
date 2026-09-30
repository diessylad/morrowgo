// Supabase-signed AMR timestamps describe authentication, unlike JWT iat which
// changes on refresh. Never use browser storage, user_metadata or token_refresh.
export const MAX_SESSION_SECONDS = 60 * 60;
const signInMethods = new Set(['password', 'oauth', 'otp', 'magiclink', 'email/signup', 'invite', 'sso/saml', 'recovery']);
export function sessionWithinLifetime(claims, userId, now = Date.now()) {
  if (!claims || claims.sub !== userId || !claims.session_id || !Array.isArray(claims.amr)) return false;
  const times = claims.amr.filter(item => signInMethods.has(item.method)).map(item => item.timestamp);
  if (!times.length || times.some(time => !Number.isSafeInteger(time) || time <= 0)) return false;
  const age = now / 1000 - Math.min(...times);
  return age >= 0 && age < MAX_SESSION_SECONDS;
}
export async function verifySessionLifetime(client, userId) {
  try {
    const { data, error } = await client.auth.getClaims();
    return !error && sessionWithinLifetime(data?.claims, userId);
  } catch { return false; }
}
export async function expireLocalSession(client) {
  try { await client.auth.signOut({ scope: 'local' }); } catch { /* Access remains denied even during an Auth outage. */ }
}
