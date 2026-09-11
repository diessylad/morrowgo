import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';

// Isolated database-test dependency; see docs/database-foundation.md.
// Does not connect to Supabase, Stripe, Redis or an eSIM provider.
const { PGlite } = createRequire(import.meta.url)(process.env.PGLITE_MODULE || '@electric-sql/pglite');
const migration = await readFile(new URL('../migrations/202609110002_customer_account_foundation.sql', import.meta.url), 'utf8');
const previous = await readFile(new URL('../migrations/202609110001_customer_accounts.sql', import.meta.url), 'utf8');
const ids = {
  a: '11111111-1111-4111-8111-111111111111', b: '22222222-2222-4222-8222-222222222222',
  oa: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', ob: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  ea: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', eb: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
};
const orderSeed = `insert into public.customer_orders(id,user_id,plan_name) values
  ('${ids.oa}','${ids.a}','Existing plan A'),('${ids.ob}','${ids.b}','Existing plan B');
  insert into public.customer_esims(id,user_id,order_id) values
  ('${ids.ea}','${ids.a}','${ids.oa}'),('${ids.eb}','${ids.b}','${ids.ob}');`;

async function denied(db, sql) {
  await assert.rejects(db.query(sql), error => error.code === '42501', sql);
}
async function snapshot(db) {
  const values = {};
  for (const table of ['profiles', 'customer_orders', 'customer_esims']) values[table] = (await db.query(`select * from public.${table} order by id`)).rows;
  return values;
}

for (const scenario of ['fresh database', 'upgrade from migration 001', 'safe repeated execution']) {
  test(scenario + ': only owner SELECT, no client writes, retained data', async t => {
    const db = new PGlite();
    await db.waitReady;
    t.after(() => db.close());
    await db.exec(`create role anon; create role authenticated; create role service_role bypassrls;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid$$;
      grant usage on schema auth, public to anon, authenticated, service_role;
      grant execute on function auth.uid() to anon, authenticated, service_role;
      insert into auth.users values ('${ids.a}'),('${ids.b}');`);
    if (scenario === 'upgrade from migration 001') {
      await db.exec(previous);
      await db.exec(orderSeed);
      await db.exec(`insert into morrowgo_private.esim_providers(esim_id,provider) values ('${ids.ea}','test-adapter');`);
    }
    await db.exec(migration);
    assert.equal((await db.query('select * from public.profiles')).rows.length, 0, 'No automatic profile backfill or auth change');
    if (scenario !== 'upgrade from migration 001') await db.exec(orderSeed);
    await db.exec(`set role service_role;
      insert into public.profiles(id,display_name) values ('${ids.a}','Traveller A'),('${ids.b}','Traveller B');
      reset role;`);
    const before = await snapshot(db);
    if (scenario === 'safe repeated execution') {
      await db.exec(`grant all on public.profiles,public.customer_orders,public.customer_esims to public, anon, authenticated;
        grant update(display_name),insert(display_name) on public.profiles to authenticated;
        grant select(id) on public.profiles to anon;
        create policy accidental_public_access on public.profiles for all to public using (true) with check (true);
        create policy accidental_public_access on public.customer_orders for all to public using (true) with check (true);
        create policy accidental_public_access on public.customer_esims for all to public using (true) with check (true);`);
      await db.exec(migration);
      assert.deepEqual(await snapshot(db), before, 'Rerunning must retain every row');
    }
    const policies = (await db.query(`select tablename,cmd,roles from pg_policies where schemaname='public' order by tablename`)).rows;
    assert.equal(policies.length, 3);
    assert.equal((await db.query("select has_column_privilege('authenticated','public.profiles','display_name','UPDATE') as allowed")).rows[0].allowed, false);
    assert.equal((await db.query("select has_column_privilege('anon','public.profiles','id','SELECT') as allowed")).rows[0].allowed, false);
    assert.ok(policies.every(p => p.cmd === 'SELECT' && JSON.stringify(p.roles).includes('authenticated')));
    const flags = (await db.query(`select relrowsecurity,relforcerowsecurity from pg_class
      where oid in ('public.profiles'::regclass,'public.customer_orders'::regclass,'public.customer_esims'::regclass)`)).rows;
    assert.ok(flags.every(row => row.relrowsecurity && row.relforcerowsecurity));
    for (const [owner, order, esim, foreignOwner, foreignOrder, foreignEsim] of [
      [ids.a,ids.oa,ids.ea,ids.b,ids.ob,ids.eb], [ids.b,ids.ob,ids.eb,ids.a,ids.oa,ids.ea]
    ]) {
      await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','${owner}',false);`);
      for (const [table, ownId, otherId] of [['profiles',owner,foreignOwner],['customer_orders',order,foreignOrder],['customer_esims',esim,foreignEsim]]) {
        assert.deepEqual((await db.query(`select id from public.${table}`)).rows.map(r => r.id), [ownId]);
        assert.equal((await db.query(`select * from public.${table} where id='${otherId}'`)).rows.length, 0, 'Foreign IDs reveal no rows');
        await denied(db, `update public.${table} set id=id where id='${ownId}'`);
        await denied(db, `delete from public.${table} where id='${ownId}'`);
        await denied(db, `truncate public.${table}`);
      }
      await denied(db, `insert into public.profiles(id) values ('${foreignOwner}')`);
      await denied(db, `insert into public.customer_orders(user_id) values ('${owner}')`);
      await denied(db, `insert into public.customer_esims(user_id) values ('${owner}')`);
      await db.exec('reset role;');
    }
    await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub','',false);`);
    for (const table of ['profiles','customer_orders','customer_esims']) assert.equal((await db.query(`select * from public.${table}`)).rows.length, 0);
    await db.exec('reset role; set role anon;');
    for (const table of ['profiles','customer_orders','customer_esims']) await denied(db, `select * from public.${table}`);
    await db.exec('reset role;');
    await assert.rejects(db.query(`insert into public.customer_esims(user_id,order_id) values ('${ids.a}','${ids.ob}')`), error => error.code === '23503');
    assert.deepEqual(await snapshot(db), before, 'Denied requests preserve data');
    if (scenario === 'upgrade from migration 001') {
      assert.equal((await db.query('select count(*)::int as count from morrowgo_private.esim_providers')).rows[0].count, 1, 'Prior private schema is untouched');
    } else {
      assert.equal((await db.query("select count(*)::int as count from pg_namespace where nspname='morrowgo_private'")).rows[0].count, 0, 'No supplier schema added by this migration');
    }
  });
}
