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
  if (typeof value !== 'string' || value.length > 1500 || !value.startsWith('/') || value.startsWith('//') || /[\\\x00-\x20]/.test(value)) return '/account';
  const url = new URL(value, 'https://www.morrowgo.com');
  if (/^\/account(?:\/[a-z0-9-]+)*$/.test(url.pathname)) {
    const params = new URLSearchParams();
    for (const key of ['install', 'topup']) {
      const id = url.searchParams.get(key);
      if (/^[0-9a-f-]{36}$/i.test(id || '')) params.set(key, id);
    }
    return url.pathname + (params.size ? `?${params}` : '');
  }
  if (url.pathname === '/profile' || url.pathname === '/dashboard') return url.pathname;
  if (url.pathname === '/checkout') {
    const iso = url.searchParams.get('iso'), plan = url.searchParams.get('plan');
    if (/^[A-Z]{2}$/.test(iso || '') && /^[\w.-]{1,255}$/.test(plan || '')) return `/checkout?${new URLSearchParams({iso, plan})}`;
  }
  if (url.pathname === '/checkout/success' && /^cs_(test|live)_[A-Za-z0-9]+$/.test(url.searchParams.get('session_id') || '')) return `/checkout/success?${new URLSearchParams({session_id:url.searchParams.get('session_id')})}`;
  return '/account';
}

export function siteOrigin(env = process.env) {
  // Never let a stale local environment value leak into production emails/OAuth.
  if (env.NODE_ENV !== 'development' || env.VERCEL_ENV === 'production') return 'https://www.morrowgo.com';
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
