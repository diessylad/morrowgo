import 'server-only';
import { readCustomerEsims, readCustomerOrders } from '../../lib/account/readers';
import { getUsageSummary } from '../../lib/esims/usage';

export async function loadCustomerEsims(client, userId) {
  try {
    const result = await readCustomerEsims(client, userId);
    if (result.error || !Array.isArray(result.data)) return { records: [], unavailable: true };
    return { records: result.data, unavailable: false };
  } catch {
    return { records: [], unavailable: true };
  }
}

export async function loadCustomerOrders(client, userId) {
  try {
    const result = await readCustomerOrders(client, userId);
    if (result.error || !Array.isArray(result.data)) return { records: [], unavailable: true };
    return { records: result.data, unavailable: false };
  } catch {
    return { records: [], unavailable: true };
  }
}

export function usagePresentation(esim) {
  const usage = getUsageSummary(esim);
  return {
    initialLabel: usage.initialLabel,
    remainingLabel: usage.remainingLabel,
    usedLabel: usage.usedLabel,
    remainingPercent: usage.remainingPercent,
    isUnlimited: usage.isUnlimited
  };
}
