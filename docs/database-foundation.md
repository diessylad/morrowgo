# Run the customer database foundation

In the MORROWGO Supabase project, open **SQL Editor → New query**, paste the
entire file below and click **Run**:

`supabase/migrations/202609110002_customer_account_foundation.sql`

This is the only SQL file needed for the three-table foundation. It works on a
fresh database and after `202609110001_customer_accounts.sql`. It can be run
again without deleting rows. Do not run the older `001` file after this file in
SQL Editor: the older file is not designed for repeated execution. When using
the migration CLI instead, keep normal migration order and align migration
history with any migrations previously applied manually.

The migration creates:

| Table | Owner | Purpose |
| --- | --- | --- |
| `public.profiles` | `id = auth.users.id` | Display name and creation/update timestamps |
| `public.customer_orders` | `user_id = auth.users.id` | Customer-safe order information |
| `public.customer_esims` | `user_id = auth.users.id` | Provider-independent eSIM/usage information |

Authenticated users have **SELECT only**, scoped by `auth.uid()` to their own
rows. Anonymous access and client INSERT, UPDATE, DELETE and TRUNCATE are not
granted. RLS is enabled and forced. Previous policies on these three tables are
replaced so an older permissive policy cannot expose other customers' data.
A composite foreign key prevents an eSIM from referencing another user's order.
Trusted server/admin access can populate the tables later.

Existing orders and eSIMs retain their rows and the schema expected by the
current account readers. `CREATE TABLE IF NOT EXISTS` does not convert arbitrary
pre-existing schemas: existing customer tables should match migration `001`,
and any pre-existing `profiles` table must use the Auth user UUID as `id`.

This migration does not add a signup trigger, backfill profiles, change Auth
settings, automatically import guest orders, or connect any supplier. Profile
rows remain empty until trusted server/admin code creates them. The
`updated_at` value is to be maintained by that future writer. UI, Stripe,
webhook, Redis and fulfillment code are unchanged. No remote migration is
executed by committing this file.

## Verification

Run the existing application checks from the repository:

```sh
npm test
npm run build
```

The database tests use an isolated PostgreSQL engine, not a hosted database.
Install the test-only engine outside the application so its dependencies and
lockfile remain unchanged:

```sh
npm install --prefix /tmp/morrowgo-db-tests --no-save @electric-sql/pglite@0.5.8
PGLITE_MODULE=/tmp/morrowgo-db-tests/node_modules/@electric-sql/pglite node --test supabase/tests/customer-account-foundation.test.mjs
```

They execute the SQL for a fresh database, an upgrade from `001`, and repeated
execution with existing rows and unsafe legacy grants/policies. They verify two
separate owners, foreign IDs, missing identities, anonymous access, denied
writes, service-role profile creation and the cross-owner foreign key. The
earlier migration's private tables, when present, remain unchanged.
