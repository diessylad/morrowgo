import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

// Isolated PostgreSQL tests; no external services or real purchases.
const { PGlite } = createRequire(import.meta.url)(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const foundation = await readFile(new URL('../migrations/202609110002_customer_account_foundation.sql', import.meta.url), 'utf8');
const migration = await readFile(new URL('../migrations/202609110003_stripe_customer_orders.sql', import.meta.url), 'utf8');
const users = {
  a: '11111111-1111-4111-8111-111111111111',
  b: '22222222-2222-4222-8222-222222222222',
  absent: '33333333-3333-4333-8333-333333333333'
};
const signature = 'public.record_paid_customer_order(text,uuid,text,text,bigint,text,timestamptz)';
const defaults = {
  session: 'cs_test_account_order', user: users.a, iso: 'DE', plan: 'MORROWGO Germany eSIM - 1 GB',
  amount: 499, currency: 'USD', at: new Date(Date.now() - 60_000).toISOString()
};

async function setup(t) {
  const db = new PGlite();
  await db.waitReady;
  t.after(() => db.close());
  await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
    create schema auth; create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    insert into auth.users values ('${users.a}'), ('${users.b}');`);
  await db.exec(foundation);
  await db.exec(migration);
  return db;
}

async function record(db, overrides = {}) {
  const v = { ...defaults, ...overrides };
  return (await db.query(`select public.record_paid_customer_order(
    $1::text,$2::uuid,$3::text,$4::text,$5::bigint,$6::text,$7::timestamptz
  ) as id`, [v.session, v.user, v.iso, v.plan, v.amount, v.currency, v.at])).rows[0].id;
}

async function counts(db) {
  return (await db.query(`select
    (select count(*)::int from public.customer_orders) as orders,
    (select count(*)::int from morrowgo_private.stripe_customer_orders) as mappings,
    (select count(*)::int from public.customer_esims) as esims,
    (select count(*)::int from public.profiles) as profiles`)).rows[0];
}

async function denied(db, sql) {
  await assert.rejects(db.query(sql), error => error.code === '42501');
}

test('paid account orders: unique retries, owner SELECT, private references and service-only RPC', async t => {
  const db = await setup(t);
  await db.exec('set role service_role;');
  const first = await record(db);
  assert.equal(await record(db), first);
  // PGlite queues these requests on one connection. This checks repeated
  // deliveries; real PostgreSQL also serializes the session advisory lock.
  const duplicates = await Promise.all(Array.from({ length: 8 }, () => record(db)));
  assert.ok(duplicates.every(id => id === first));
  const second = await record(db, { session: 'cs_live_second_order', user: users.b });
  assert.notEqual(second, first);
  await db.exec('reset role;');
  assert.deepEqual(await counts(db), { orders: 2, mappings: 2, esims: 0, profiles: 0 });
  const publicColumns = (await db.query(`select column_name from information_schema.columns
    where table_schema='public' and table_name='customer_orders'`)).rows.map(r => r.column_name);
  assert.ok(!publicColumns.includes('stripe_session_id'));
  const functionInfo = (await db.query(`select prosecdef,proconfig from pg_proc where oid='${signature}'::regprocedure`)).rows[0];
  assert.equal(functionInfo.prosecdef, false, 'Function cannot elevate client privileges');
  assert.ok(functionInfo.proconfig.some(value => value === 'search_path=""'));
  const flags = (await db.query(`select relrowsecurity,relforcerowsecurity from pg_class
    where oid='morrowgo_private.stripe_customer_orders'::regclass`)).rows[0];
  assert.ok(flags.relrowsecurity && flags.relforcerowsecurity);

  for (const [user, own, other] of [[users.a, first, second], [users.b, second, first]]) {
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${user}',false);`);
    assert.deepEqual((await db.query('select id from public.customer_orders')).rows, [{ id: own }]);
    assert.equal((await db.query('select * from public.customer_orders where id=$1', [other])).rows.length, 0);
    await assert.rejects(record(db, { user }), error => error.code === '42501');
    await denied(db, 'select * from morrowgo_private.stripe_customer_orders');
    await denied(db, `update public.customer_orders set status='refunded' where id='${own}'`);
    await denied(db, `insert into public.customer_orders(user_id) values ('${user}')`);
    await denied(db, `delete from public.customer_orders where id='${own}'`);
    await db.exec('reset role;');
  }
  await db.exec('set role anon;');
  await assert.rejects(record(db), error => error.code === '42501');
  await denied(db, 'select * from public.customer_orders');
  await denied(db, 'select * from morrowgo_private.stripe_customer_orders');
  await db.exec('reset role;');
  assert.deepEqual(await counts(db), { orders: 2, mappings: 2, esims: 0, profiles: 0 });
});

test('paid order retries preserve ownership and advanced statuses while updating trusted payment fields', async t => {
  const db = await setup(t);
  await db.exec('set role service_role;');
  const id = await record(db);
  const before = (await db.query('select * from public.customer_orders where id=$1', [id])).rows;
  await assert.rejects(record(db, { user: users.b }), error => error.code === '22023');
  assert.deepEqual((await db.query('select * from public.customer_orders where id=$1', [id])).rows, before);
  for (const status of ['pending', 'unknown', 'paid', 'processing', 'awaiting_fulfillment', 'ready', 'failed', 'cancelled', 'refunded']) {
    await db.query('update public.customer_orders set status=$1 where id=$2', [status, id]);
    assert.equal(await record(db, { amount: 0, currency: 'EUR', plan: 'MORROWGO Germany eSIM - 3 GB', iso: 'FR' }), id);
    const row = (await db.query('select * from public.customer_orders where id=$1', [id])).rows[0];
    assert.equal(row.user_id, users.a);
    assert.equal(row.status, ['pending', 'unknown'].includes(status) ? 'paid' : status);
    assert.equal(Number(row.amount_total), 0);
    assert.equal(row.currency, 'EUR');
    assert.equal(row.destination_iso, 'FR');
    assert.equal(row.plan_name, 'MORROWGO Germany eSIM - 3 GB');
  }
  const unlinked = (await db.query('insert into public.customer_orders(user_id) values ($1) returning id', [users.a])).rows[0].id;
  await assert.rejects(db.query(`insert into morrowgo_private.stripe_customer_orders
    (stripe_session_id,order_id,user_id) values ('cs_test_wrong_owner',$1,$2)`, [unlinked, users.b]),
  error => error.code === '23503', 'Composite FK prevents pairing an order with a different owner');
  await db.query('delete from public.customer_orders where id=$1', [unlinked]);
  await db.exec('reset role;');
  assert.deepEqual(await counts(db), { orders: 1, mappings: 1, esims: 0, profiles: 0 });
});

test('invalid payment data and failures after order insertion leave no partial account order', async t => {
  const db = await setup(t);
  await db.exec('set role service_role;');
  for (const invalid of [
    { session: null }, { session: 'not-a-session' }, { session: 'cs_test_bad/path' }, { session: 'cs_test_' + 'a'.repeat(255) },
    { user: null }, { iso: null }, { iso: 'de' }, { iso: 'DEU' },
    { plan: null }, { plan: ' ' }, { plan: 'a'.repeat(501) },
    { amount: null }, { amount: -1 }, { amount: '9007199254740992' },
    { currency: null }, { currency: 'usd' }, { currency: 'US' },
    { at: null }, { at: 'infinity' }, { at: '-infinity' }, { at: '1969-01-01T00:00:00Z' },
    { at: new Date(Date.now() + 3 * 86400_000).toISOString() }
  ]) await assert.rejects(record(db, invalid), error => error.code === '22023', JSON.stringify(invalid));
  await assert.rejects(record(db, { user: users.absent }), error => error.code === '23503');
  await db.exec('reset role;');
  assert.deepEqual(await counts(db), { orders: 0, mappings: 0, esims: 0, profiles: 0 });

  // Simulate a database failure between the customer INSERT and private mapping
  // INSERT. A failed RPC statement must roll back both parts atomically.
  await db.exec(`create function morrowgo_private.test_mapping_failure() returns trigger
    language plpgsql as $$begin raise exception 'test-only mapping failure'; end$$;
    create trigger test_mapping_failure before insert on morrowgo_private.stripe_customer_orders
      for each row execute function morrowgo_private.test_mapping_failure();
    set role service_role;`);
  await assert.rejects(record(db), error => error.code === 'P0001');
  await db.exec('reset role;');
  assert.deepEqual(await counts(db), { orders: 0, mappings: 0, esims: 0, profiles: 0 });
  await db.exec(`drop trigger test_mapping_failure on morrowgo_private.stripe_customer_orders;
    drop function morrowgo_private.test_mapping_failure(); set role service_role;`);
  await record(db);
  await db.exec('reset role;');
  assert.deepEqual(await counts(db), { orders: 1, mappings: 1, esims: 0, profiles: 0 });
});

test('rerunning migration preserves data and restores service-only function/private-table access', async t => {
  const db = await setup(t);
  await db.exec('set role service_role;');
  const id = await record(db);
  await db.exec('reset role;');
  const beforeOrders = (await db.query('select * from public.customer_orders')).rows;
  const beforeMapping = (await db.query('select * from morrowgo_private.stripe_customer_orders')).rows;
  const beforePolicies = (await db.query(`select schemaname,tablename,policyname,roles,cmd,qual
    from pg_policies where schemaname='public' order by tablename,policyname`)).rows;
  await db.exec(`grant execute on function ${signature} to public,anon,authenticated;
    grant all on schema morrowgo_private to anon,authenticated;
    grant all on table morrowgo_private.stripe_customer_orders to public,anon,authenticated;`);
  await db.exec(migration);
  assert.deepEqual((await db.query('select * from public.customer_orders')).rows, beforeOrders);
  assert.deepEqual((await db.query('select * from morrowgo_private.stripe_customer_orders')).rows, beforeMapping);
  assert.deepEqual((await db.query(`select schemaname,tablename,policyname,roles,cmd,qual
    from pg_policies where schemaname='public' order by tablename,policyname`)).rows, beforePolicies);
  for (const role of ['anon', 'authenticated']) {
    const privileges = (await db.query(`select
      has_function_privilege($1,'${signature}','EXECUTE') as rpc,
      has_schema_privilege($1,'morrowgo_private','USAGE') as schema,
      has_table_privilege($1,'morrowgo_private.stripe_customer_orders','SELECT') as table_read`, [role])).rows[0];
    assert.deepEqual(privileges, { rpc: false, schema: false, table_read: false });
  }
  await db.exec('set role service_role;');
  assert.equal(await record(db), id);
  await db.exec('reset role;');
});
