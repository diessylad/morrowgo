import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../lib/esims/usage.js', import.meta.url), 'utf8');
const { formatDataBytes, getUsageSummary } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));

test('usage uses decimal MB and GB with readable precision', () => {
  assert.equal(formatDataBytes(6.4e9), '6.4 GB');
  assert.equal(formatDataBytes(250e6), '250 MB');
  assert.equal(formatDataBytes(0), '0 MB');
  assert.equal(formatDataBytes(1), '< 0.01 MB');
});

test('missing, invalid and unsafe byte values remain unknown', () => {
  for (const value of [null, undefined, NaN, Infinity, -Infinity, -1, 0.5, '1000', Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(formatDataBytes(value), null);
    const usage = getUsageSummary({ initialDataBytes: value, remainingDataBytes: value, usedDataBytes: value });
    assert.equal(usage.remainingPercent, null);
    assert.equal(usage.usedBytes, null);
  }
  assert.equal(getUsageSummary(null).remainingPercent, null);
});

test('known usage computes percentage and preserves reported counters', () => {
  const usage = getUsageSummary({ initialDataBytes: 10e9, remainingDataBytes: 6.4e9, usedDataBytes: 3.6e9 });
  assert.equal(usage.remainingPercent, 64);
  assert.equal(usage.remainingLabel, '6.4 GB');
  assert.equal(usage.usedLabel, '3.6 GB');
});

test('unknown usage counters are not fabricated by subtraction', () => {
  const usage = getUsageSummary({ initialDataBytes: 10e9, usedDataBytes: 3.6e9 });
  assert.equal(usage.remainingBytes, null);
  assert.equal(usage.remainingPercent, null);
  assert.equal(getUsageSummary({ initialDataBytes: 10e9, remainingDataBytes: 6.4e9 }).usedLabel, null);
});

test('zero totals and unlimited plans do not produce misleading percentages', () => {
  assert.equal(getUsageSummary({ initialDataBytes: 0, remainingDataBytes: 0 }).remainingPercent, null);
  const usage = getUsageSummary({ initialDataBytes: 10e9, remainingDataBytes: 5e9, isUnlimited: true });
  assert.equal(usage.remainingPercent, null);
  assert.equal(usage.initialLabel, 'Unlimited');
  assert.equal(getUsageSummary({ initialDataBytes: 10e9, remainingDataBytes: 0 }).remainingPercent, 0);
});

test('inconsistent supplier counters cannot overflow progress bars', () => {
  const usage = getUsageSummary({ initialDataBytes: 1e9, remainingDataBytes: 2e9, usedDataBytes: 3e9 });
  assert.equal(usage.remainingPercent, 100);
  assert.equal(usage.remainingBytes, 2e9);
  assert.equal(usage.usedBytes, 3e9);
});
