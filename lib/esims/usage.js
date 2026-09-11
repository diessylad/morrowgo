export function safeBytes(value) {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 ? value : null;
}

export function formatDataBytes(value) {
  const bytes = safeBytes(value);
  if (bytes === null) return null;
  const unit = bytes >= 1e9 ? 'GB' : 'MB';
  const amount = bytes / (unit === 'GB' ? 1e9 : 1e6);
  if (bytes > 0 && amount < 0.01) return '< 0.01 ' + unit;
  return new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(amount) + ' ' + unit;
}

export function getUsageSummary(esim = {}) {
  esim = esim || {};
  const initialBytes = safeBytes(esim.initialDataBytes);
  const remainingBytes = safeBytes(esim.remainingDataBytes);
  const usedBytes = safeBytes(esim.usedDataBytes);
  const isUnlimited = esim.isUnlimited === true;
  // Missing counters remain unknown; one counter is never invented from another.
  const remainingPercent = !isUnlimited && initialBytes !== null && initialBytes > 0 && remainingBytes !== null
    ? Math.min(100, Math.max(0, remainingBytes / initialBytes * 100)) : null;
  return {
    initialBytes, remainingBytes, usedBytes, remainingPercent, isUnlimited,
    initialLabel: isUnlimited ? 'Unlimited' : formatDataBytes(initialBytes),
    remainingLabel: formatDataBytes(remainingBytes),
    usedLabel: formatDataBytes(usedBytes)
  };
}
