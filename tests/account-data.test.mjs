import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const url = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const read = path => readFile(new URL(path, import.meta.url), 'utf8');
const usageUrl = url(await read('../lib/esims/usage.js'));
const modelUrl = url((await read('../lib/esims/model.js')).replace("'./usage'", JSON.stringify(usageUrl)));
const readersUrl = url((await read('../lib/account/readers.js')).replace("'../esims/model'", JSON.stringify(modelUrl)));
const { serializeCustomerEsim, serializeCustomerOrder, normalizeInternalEsim } = await import(modelUrl);
const { readCustomerEsims, readCustomerEsim, readCustomerOrders } = await import(readersUrl);
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const EA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const EB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const rows = [{ id: EA, user_id: A, plan_name: 'A plan', provider: 'private', provider_esim_id: 'secret-id' }, { id: EB, user_id: B, plan_name: 'B plan' }];

function mockClient({ error = null, throws = false, ignoreFilters = false } = {}) {
  const calls = [];
  return {
    calls,
    from(table) {
      const filters = [];
      calls.push({ table, filters });
      const call = calls.at(-1);
      const result = single => {
        if (throws) throw new Error('secret backend endpoint');
        const data = ignoreFilters ? rows : rows.filter(row => filters.every(([key, value]) => row[key] === value));
        return { data: single ? data[0] || null : data, error };
      };
      const query = {
        select(columns) { call.columns = columns; return query; },
        eq(key, value) { filters.push([key, value]); return query; },
        order() { return query; },
        limit() { return Promise.resolve(result(false)); },
        maybeSingle() { return Promise.resolve(result(true)); }
      };
      return query;
    }
  };
}

test('each account list scopes queries to its verified owner and strips internal fields', async () => {
  const client = mockClient();
  for (const readOwned of [readCustomerEsims, readCustomerOrders]) {
    assert.deepEqual((await readOwned(client, A)).data.map(row => row.id), [EA]);
    assert.deepEqual((await readOwned(client, B)).data.map(row => row.id), [EB]);
  }
  for (const call of client.calls) {
    assert.equal(call.filters[0][0], 'user_id');
    assert.ok(!call.columns.includes('*'));
    assert.ok(!call.columns.includes('provider'));
  }
  assert.ok(!JSON.stringify((await readCustomerEsims(client, A)).data).includes('secret-id'));
});

test('a foreign eSIM id cannot be read by another account', async () => {
  const client = mockClient();
  assert.equal((await readCustomerEsim(client, A, EB)).data, null);
  assert.equal((await readCustomerEsim(client, B, EB)).data.id, EB);
  assert.deepEqual(client.calls[0].filters, [['user_id', A], ['id', EB]]);
});

test('missing/invalid ids fail closed without querying all records', async () => {
  const client = mockClient();
  for (const id of [undefined, null, '', '../other', 'not-a-uuid']) {
    assert.equal((await readCustomerEsim(client, A, id)).error, 'invalid_id');
  }
  assert.equal(client.calls.length, 0);
  assert.equal((await readCustomerEsims(client, null)).error, 'unavailable');
});

test('errors and inconsistent ownership cannot leak database responses', async () => {
  for (const client of [mockClient({ error: { message: 'private error' } }), mockClient({ throws: true }), mockClient({ ignoreFilters: true })]) {
    assert.deepEqual(await readCustomerEsims(client, A), { data: null, error: 'unavailable' });
  }
  assert.deepEqual(await readCustomerEsim(mockClient({ ignoreFilters: true }), B, EA), { data: null, error: 'unavailable' });
});

test('serialization is an explicit allowlist including nested installation data', () => {
  const row = {
    ...rows[0], stripe_session_id: 'stripe-private', wholesale_amount: 1, raw_metadata: { secret: true },
    install_details: { smdpAddress: 'example.invalid', activationCode: 'customer-owned-code', apiKey: 'private-key' }
  };
  const esim = serializeCustomerEsim(row);
  assert.deepEqual(esim.installDetails, { smdpAddress: 'example.invalid', activationCode: 'customer-owned-code', confirmationCode: null });
  for (const value of [esim, serializeCustomerOrder(row)]) {
    for (const key of ['user_id', 'provider', 'provider_esim_id', 'stripe_session_id', 'wholesale_amount', 'raw_metadata']) assert.ok(!(key in value));
    assert.ok(!JSON.stringify(value).includes('private-key'));
  }
  assert.equal(normalizeInternalEsim(row, { provider: 'server-only', provider_esim_id: 'internal' }).providerEsimId, 'internal');
});

async function api(state) {
  const authUrl = url(`export async function getVerifiedAccount() { return globalThis.__morrowgoAccountFixture; }`);
  globalThis.__morrowgoAccountFixture = state;
  const apiUrl = url((await read('../lib/account/api.js')).replace("'../auth/session'", JSON.stringify(authUrl)));
  const routeUrl = url((await read('../app/api/account/esims/route.js'))
    .replace("'../../../../lib/account/api'", JSON.stringify(apiUrl))
    .replace("'../../../../lib/account/readers'", JSON.stringify(readersUrl)));
  return (await import(routeUrl)).GET();
}

test('account API rejects missing config and unauthenticated sessions', async () => {
  try {
    assert.equal((await api({ configured: false, user: null })).status, 503);
    assert.equal((await api({ configured: true, user: null })).status, 401);
    const result = await api({ configured: true, user: { id: A }, client: mockClient() });
    assert.equal(result.status, 200);
    assert.match(result.headers.get('cache-control'), /no-store/);
    assert.deepEqual((await result.json()).esims.map(item => item.id), [EA]);
  } finally {
    delete globalThis.__morrowgoAccountFixture;
  }
});

test('unconfigured provider usage adapter does not make network calls', async () => {
  const source = (await read('../lib/esims/provider.js')).replace("import 'server-only';", '');
  const { refreshEsimUsage } = await import(url(source));
  assert.deepEqual(await refreshEsimUsage(), { supported: false, data: null, error: 'provider_not_configured' });
});
