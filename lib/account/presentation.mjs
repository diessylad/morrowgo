// Display metadata only: authentication and authorization still use requireAccount.
const clean = value => typeof value === 'string' ? value.trim().slice(0, 160) : '';
export function accountProfile(user = {}) {
  const meta = user.user_metadata || {};
  const parts = clean(meta.full_name || meta.name).split(/\s+/).filter(Boolean);
  const fallbackFirst = parts.shift() || '';
  const firstName = typeof meta.first_name === 'string' ? clean(meta.first_name) : fallbackFirst;
  const lastName = typeof meta.last_name === 'string' ? clean(meta.last_name) : parts.join(' ');
  const name = [firstName, lastName].filter(Boolean).join(' ');
  return { firstName, lastName, name, email: clean(user.email), initials: (Array.from(firstName)[0] || '') + (Array.from(lastName)[0] || '') || 'M' };
}
export function countryFlag(iso) {
  return /^[A-Z]{2}$/.test(iso || '') ? [...iso].map(c => String.fromCodePoint(127397 + c.charCodeAt(0))).join('') : '◎';
}
export function countryName(item, language = 'en') {
  if (/^[A-Z]{2}$/.test(item.destinationIso || '')) {
    try { return new Intl.DisplayNames([language], { type: 'region' }).of(item.destinationIso); } catch {}
  }
  return item.destinationName || '—';
}
export function daysRemaining(esim, asOf) {
  const expiry = Date.parse(esim.expiresAt), now = Date.parse(asOf);
  return Number.isFinite(expiry) && Number.isFinite(now) ? Math.max(0, Math.ceil((expiry - now) / 86400000)) : null;
}
export function dashboardSummary(esims, asOf) {
  const active = esims.filter(e => e.status === 'active' && daysRemaining(e, asOf) !== 0);
  const focus = active[0] || esims.find(e => e.status === 'ready') || null;
  const countries = new Set(esims.filter(e => e.status === 'active' || Number.isFinite(Date.parse(e.activatedAt))).map(e => e.destinationIso).filter(Boolean));
  return { activeCount: active.length, countries: countries.size, focus };
}

export function esimStatus(esim, asOf) {
  if (esim.status === 'active' && daysRemaining(esim, asOf) === 0) return 'expired';
  return esim.status;
}
export function aggregateRemaining(esims, asOf) {
  const available = esims.filter(e => ['active', 'ready'].includes(esimStatus(e, asOf)));
  if (!available.length) return { kind: 'known', bytes: 0 };
  if (available.some(e => e.isUnlimited === true)) return { kind: 'unlimited', bytes: null };
  if (available.some(e => !Number.isSafeInteger(e.remainingDataBytes) || e.remainingDataBytes < 0)) return { kind: 'unknown', bytes: null };
  const bytes = available.reduce((sum,e) => sum + e.remainingDataBytes, 0);
  return Number.isSafeInteger(bytes) ? { kind:'known', bytes } : { kind:'unknown', bytes:null };
}
