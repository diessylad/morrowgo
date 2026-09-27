export const CONSENT_KEY = 'morrowgo-cookie-consent';
export const CONSENT_VERSION = 1;
export const MAX_AGE = 180 * 24 * 60 * 60 * 1000;
export function readConsent(raw, now = Date.now()) {
  try {
    const value = JSON.parse(raw);
    if (value.version !== CONSENT_VERSION || typeof value.analytics !== 'boolean' || typeof value.marketing !== 'boolean' || !Number.isFinite(value.savedAt) || value.savedAt > now || now - value.savedAt >= MAX_AGE) return null;
    return { ...value, necessary: true };
  } catch { return null; }
}
export function makeConsent(analytics, marketing) {
  return { version: CONSENT_VERSION, necessary: true, analytics: !!analytics, marketing: !!marketing, savedAt: Date.now() };
}
