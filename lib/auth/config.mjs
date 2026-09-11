export function getAuthConfig(env = process.env) {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const parsed = new URL(url);
    const local = ['localhost', '127.0.0.1'].includes(parsed.hostname);
    if (parsed.username || parsed.password || (parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:'))) return null;
    return { url: parsed.origin, key };
  } catch { return null; }
}

export function safeAccountPath(value) {
  return typeof value === 'string' && /^\/account(?:\/[a-z0-9-]+)*$/.test(value) ? value : '/account';
}

export function siteOrigin(env = process.env) {
  try {
    const url = new URL(env.NEXT_PUBLIC_SITE_URL || 'https://www.morrowgo.com');
    if (url.username || url.password || (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))) throw new Error();
    return url.origin;
  } catch { return 'https://www.morrowgo.com'; }
}

export function validEmail(value) {
  return typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validPassword(value) {
  return typeof value === 'string' && value.length >= 12 && new TextEncoder().encode(value).length <= 72;
}

export function validRecoveryToken(value) {
  return typeof value === 'string' && /^[A-Za-z0-9_-]{20,256}$/.test(value);
}
