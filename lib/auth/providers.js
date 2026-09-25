import 'server-only';
import { getAuthConfig } from './config.mjs';

// The public settings endpoint exposes enabled providers, never their secrets.
export async function isOAuthProviderEnabled(provider) {
  const config = getAuthConfig();
  if (!config || !['google', 'apple'].includes(provider)) return false;
  try {
    const response = await fetch(`${config.url}/auth/v1/settings`, {
      headers: { apikey: config.key },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    if (!response.ok) return false;
    const settings = await response.json();
    return settings.external?.[provider] === true;
  } catch { return false; }
}
