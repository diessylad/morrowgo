export function safeReturnPath(value) {
  if (typeof value !== 'string' || value.length > 1500 || !value.startsWith('/') || value.startsWith('//') || /[\\\s%]/.test(value)) return '/';
  try {
    const url = new URL(value, 'https://www.morrowgo.com');
    if (url.origin !== 'https://www.morrowgo.com' || url.pathname === '/destinations' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) return '/';
    return url.pathname + url.search + url.hash;
  } catch { return '/'; }
}
export function destinationsHref(returnTo, query = '') {
  const params = new URLSearchParams({ returnTo: safeReturnPath(returnTo) });
  if (query) params.set('q', query);
  return `/destinations?${params}`;
}
