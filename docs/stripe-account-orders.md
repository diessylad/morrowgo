# Link paid Stripe purchases to customer accounts

New Checkout Sessions created while a confirmed customer is signed in carry
`metadata.morrowgo_user_id`. The server gets this ID from Supabase `auth.getUser()`
through the existing verified-session helper. Browser `user_id`, metadata,
customer and reference fields cannot select an owner. Guests still purchase
without signing in and do not need the privileged Supabase key.

The checkout also saves a display-only plan label built from the server's
catalogue, never a supplier bundle name. If configured authentication cannot be
verified due to an error, checkout fails before creating a Stripe payment rather
than silently dropping the account association. An ordinary missing session
continues through guest checkout.

## Set up before deploying the code

1. The customer database foundation (`202609110002_customer_account_foundation.sql`)
   must already be applied.
2. In Supabase SQL Editor run this **new** migration in full:
   `supabase/migrations/202609110003_stripe_customer_orders.sql`.
3. In Vercel add **`SUPABASE_SECRET_KEY`**, using a Supabase secret key
   (`sb_secret_…`) from the same project as the existing
   `NEXT_PUBLIC_SUPABASE_URL`. Keep it server-only: never prefix its name with
   `NEXT_PUBLIC_`, commit its value or paste it into support messages. Existing
   public auth variables remain unchanged.
4. Redeploy after the migration and environment variable are configured.

A legacy `SUPABASE_SERVICE_ROLE_KEY` is accepted only as a fallback when
`SUPABASE_SECRET_KEY` is absent. Only one of these privileged keys is needed;
the preferred new variable is `SUPABASE_SECRET_KEY`. Supabase's current
[API-key documentation](https://supabase.com/docs/guides/getting-started/api-keys)
explains secret keys and their `service_role` database access.

## Payment and retries

The existing webhook verifies Stripe's signature and payment event first. It
then calls a server-only Supabase client with no browser cookies or persisted
auth session. The service-role-only `record_paid_customer_order` function writes
the public order with status `paid` and stores the Stripe Session reference in
`morrowgo_private.stripe_customer_orders`, inaccessible to customers. The
customer's row contains only the public order UUID and customer-safe data.

The RPC is atomic. Its session lock and unique mapping make repeated deliveries
use the same order UUID. An existing association cannot be reassigned to another
user. Replays preserve later statuses such as `ready` or `refunded` rather than
resetting them to `paid`. Existing customer RLS policies remain unchanged.

This account write runs before the unchanged Redis fulfillment block. Therefore
a Redis duplicate can still repair a missing account record. If Supabase is
unavailable, the key/migration is missing, or ownership conflicts, the webhook
returns a generic HTTP 500 and Stripe can retry. No Redis/fulfillment work is
started by that failed attempt. A DB commit followed by a network timeout is
safe to retry because the mapping is unique.

Account payment status is separate from eSIM validation/delivery. A payment can
appear as `paid` even when provider validation fails. This change neither issues
eSIMs nor creates `customer_esims` records or top-ups, and does not modify the
fulfillment flag, supplier integration, Redis locks or transaction markers.

Old guest sessions without the new owner metadata stay guest orders, including
after Resend. There is no email matching or retroactive guest claim. For a new
account association test, start a fresh authenticated Checkout Session. Use a
separate test deployment/database for Stripe sandbox orders where appropriate;
these rows represent the signed session's payment, and no new test/live account
UI is added here.

## Tests

```sh
npm test
npm run build
```

Database tests use the isolated PGlite setup in `docs/database-foundation.md`:

```sh
PGLITE_MODULE=/tmp/morrowgo-db-tests/node_modules/@electric-sql/pglite node --test supabase/tests/*.test.mjs
```

Coverage includes spoofed browser IDs, guests, auth failures, invalid signatures,
unpaid/irrelevant events, zero amounts, database failures and retry, existing
Redis duplicates, concurrent webhook lock behavior and secret-safe responses.
The real Supabase JavaScript SDK is exercised against mocked HTTP responses.
SQL tests execute both account migrations, owner checks, denied browser RPC
access, stable duplicate IDs, preserved statuses and transaction rollback.
PGlite serializes its database requests; it does not substitute for a hosted
multi-connection PostgreSQL load test.

After setup, verify in Stripe test mode: sign in, create a fresh test purchase,
check that its account order appears, then Resend and confirm that exactly one
account order remains. A different signed-in account must not see it. Verify a
guest purchase still completes without creating an owned account row.
