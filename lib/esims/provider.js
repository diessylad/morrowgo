import 'server-only';

/**
 * Future adapter contract: refreshUsage(internalEsim) returns normalized usage
 * {initialDataBytes, remainingDataBytes, usedDataBytes, usageUpdatedAt}.
 * The selected adapter will run only after verified ownership on the server.
 * No provider implementation, refresh scheduler, purchase or top-up exists yet.
 */
export async function refreshEsimUsage() {
  return { supported: false, data: null, error: 'provider_not_configured' };
}
