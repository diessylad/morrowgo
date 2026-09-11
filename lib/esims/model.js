import { safeBytes } from './usage';

const text = value => typeof value === 'string' && value.trim() ? value.trim() : null;
const boolean = value => typeof value === 'boolean' ? value : null;
const date = value => text(value) && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null;
const days = value => Number.isSafeInteger(value) && value >= 0 ? value : null;
const status = value => ['pending', 'ready', 'active', 'expired', 'suspended', 'cancelled', 'failed', 'awaiting_fulfillment', 'processing', 'paid', 'refunded'].includes(value) ? value : 'unknown';

export function serializeInstallDetails(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const details = {
    smdpAddress: text(value.smdpAddress),
    activationCode: text(value.activationCode),
    confirmationCode: text(value.confirmationCode)
  };
  return Object.values(details).some(Boolean) ? details : null;
}

// Strict customer allowlist: never spread a supplier or database response.
export function serializeCustomerEsim(row = {}) {
  return {
    id: text(row.id),
    destinationIso: /^[A-Z]{2}$/.test(row.destination_iso || '') ? row.destination_iso : null,
    destinationName: text(row.destination_name),
    planName: text(row.plan_name),
    initialDataBytes: safeBytes(row.initial_data_bytes),
    remainingDataBytes: safeBytes(row.remaining_data_bytes),
    usedDataBytes: safeBytes(row.used_data_bytes),
    isUnlimited: row.is_unlimited === true,
    validityDays: days(row.validity_days),
    activatedAt: date(row.activated_at),
    expiresAt: date(row.expires_at),
    usageUpdatedAt: date(row.usage_updated_at),
    orderedAt: date(row.ordered_at),
    status: status(row.status),
    networks: Array.isArray(row.networks) ? row.networks.filter(item => typeof item === 'string' && item.trim()).map(item => item.trim()) : [],
    supports5G: boolean(row.supports_5g),
    rechargeable: row.rechargeable === true,
    installDetails: serializeInstallDetails(row.install_details)
  };
}

export function serializeCustomerOrder(row = {}) {
  return {
    id: text(row.id),
    destinationIso: /^[A-Z]{2}$/.test(row.destination_iso || '') ? row.destination_iso : null,
    planName: text(row.plan_name),
    orderedAt: date(row.ordered_at),
    status: status(row.status),
    amountTotal: safeBytes(row.amount_total),
    currency: /^[A-Za-z]{3}$/.test(row.currency || '') ? row.currency.toUpperCase() : null
  };
}

// For trusted server adapters only. Public serializers explicitly exclude these fields.
export function normalizeInternalEsim(customerRow, privateRow = {}) {
  return {
    ...serializeCustomerEsim(customerRow),
    userId: text(customerRow.user_id),
    provider: text(privateRow.provider),
    providerOrderId: text(privateRow.provider_order_id),
    providerEsimId: text(privateRow.provider_esim_id)
  };
}
