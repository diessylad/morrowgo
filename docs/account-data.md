# Customer data foundation

This foundation is independent of the eventual eSIM supplier. It does not import
orders from Redis, change guest checkout, buy eSIMs, top up plans or refresh any
supplier API. A newly registered customer has an empty account until trusted
server-side fulfillment/ownership integration is added.

## Database setup

Review and apply `supabase/migrations/202609110001_customer_accounts.sql` once in
the intended Supabase project. This migration is not deployed automatically.
It expects Supabase Auth's `auth.users`, `auth.uid()` and standard roles.

- `public.customer_orders`: customer order ID, verified owner's user ID,
  destination, plan name, date, status, retail amount in minor units and currency.
- `public.customer_esims`: verified owner, related customer order, destination,
  plan, reported byte counters, dates, status, networks, 5G availability,
  recharge capability and installation fields.
- `morrowgo_private.order_fulfillment`: Stripe reference, provider references and
  wholesale fields, separately from customer data.
- `morrowgo_private.esim_providers`: provider-specific eSIM identity mapping.

Customer tables have row-level security (RLS) and an explicit own-user SELECT
policy. Authenticated clients cannot INSERT, UPDATE or DELETE. Anonymous clients
cannot read these tables. A composite foreign key prevents an eSIM from being
associated with a different owner's order. Private tables have RLS and no
customer grants or policies; the private schema must remain outside exposed API
schemas. No passwords or provider credentials are stored in these tables.

The future trusted fulfillment writer must verify payment and ownership before
using a server-only privileged client. The current application needs only the
publishable/anonymous Supabase key for RLS-scoped reads, not a service-role key.
Never place privileged keys in `NEXT_PUBLIC_*` variables.

## API and model contracts

`GET /api/account/esims`, `GET /api/account/esims/[id]` and
`GET /api/account/orders` verify the authenticated user on the server. Query
parameters cannot select an owner. Missing configuration returns 503;
unauthenticated sessions return 401; an inaccessible item returns 404.
Responses use `Cache-Control: private, no-store` and generic errors.

`lib/account/readers.js` exposes `readCustomerEsims(client, userId)` and
`readCustomerOrders(client, userId)` returning `{data: array|null, error}`.
`readCustomerEsim(client, userId, id)` returns a single object or null. Only call
these with the user ID returned by verified authentication. Each query also
includes `.eq('user_id', userId)`; RLS is the independent database enforcement.
Lists currently return the newest 100 records; pagination can be added when
needed.

Customer serializers in `lib/esims/model.js` use explicit field allowlists,
including nested installation fields. They never spread arbitrary database or
supplier objects into customer responses. `normalizeInternalEsim` adds provider,
provider order ID and provider eSIM ID for trusted backend use; its result must
not be sent directly to clients.

Usage uses decimal units: 1 GB = 1,000,000,000 bytes. Unknown, negative,
non-finite, fractional and unsafe integer counters produce null. Missing
counters are never derived from other fields. Known remaining percentages are
clamped to 0–100; zero totals and unlimited plans do not produce percentages.
`usageUpdatedAt` records when the supplied usage was measured. Nullable 5G
support means unknown, not unsupported. Networks are operator names only.

`lib/esims/provider.js` is a server-only adapter boundary. Its present refresh
function returns `provider_not_configured` without network access. Once a
supplier is chosen, implement an authenticated, ownership-checked backend
refresh with timeouts/rate limits and map that response to the normalized
fields. There is no polling or supplier purchase/top-up implementation now.

## Future paid guest-order claim

Guest checkout continues unchanged. Do not attach orders by a URL order ID,
Stripe session ID or unverified email. A future claim must verify the account
email and payment/order ownership through a trusted server lookup and a
short-lived, single-use proof delivered to the verified purchase address.
Prevent replay and reassignment, then atomically create the customer-safe rows
and private mappings. This claim flow is intentionally not enabled yet.

## Verification

Run `node --test tests/account-data.test.mjs tests/usage.test.mjs`. These checks
exercise ownership-scoped queries for two users, foreign item IDs, invalid IDs,
malformed responses, secret allowlists, unauthenticated APIs and usage edge
cases. Mocks verify application behavior; they do not replace a database RLS
test.

After applying the migration in a test Supabase project, create two test Auth
users and replace the two user UUIDs below with their actual IDs. Run the SQL
as a database administrator. All fixture rows are rolled back. The script
checks actual PostgreSQL privileges and policies, including direct queries
that bypass the application readers.

```sql
begin;
-- Replace with existing dedicated test Auth user IDs.
select set_config('morrowgo.qa_user_a', '11111111-1111-4111-8111-111111111111', true);
select set_config('morrowgo.qa_user_b', '22222222-2222-4222-8222-222222222222', true);
insert into public.customer_orders(id, user_id, plan_name) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', current_setting('morrowgo.qa_user_a')::uuid, 'RLS test A'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', current_setting('morrowgo.qa_user_b')::uuid, 'RLS test B');
insert into public.customer_esims(id, user_id, order_id) values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2', current_setting('morrowgo.qa_user_a')::uuid, 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2', current_setting('morrowgo.qa_user_b')::uuid, 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1');

select set_config('request.jwt.claim.sub', current_setting('morrowgo.qa_user_a'), true);
set local role authenticated;
do $$
begin
  if not exists (select 1 from public.customer_esims where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2') then
    raise exception 'Own eSIM unavailable';
  end if;
  if exists (select 1 from public.customer_esims where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2') then
    raise exception 'Foreign eSIM leaked';
  end if;
  if exists (select 1 from public.customer_orders where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1') then
    raise exception 'Foreign order leaked';
  end if;
  begin
    update public.customer_esims set remaining_data_bytes = 1;
    raise exception 'Customer UPDATE unexpectedly allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.customer_orders(user_id) values (auth.uid());
    raise exception 'Customer INSERT unexpectedly allowed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from morrowgo_private.esim_providers;
    raise exception 'Private schema unexpectedly accessible';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

select set_config('request.jwt.claim.sub', current_setting('morrowgo.qa_user_b'), true);
set local role authenticated;
do $$
begin
  if not exists (select 1 from public.customer_esims where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2') then
    raise exception 'Second user own eSIM unavailable';
  end if;
  if exists (select 1 from public.customer_esims where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2') then
    raise exception 'First user eSIM leaked to second user';
  end if;
end $$;
reset role;

set local role anon;
do $$
begin
  begin
    perform 1 from public.customer_esims;
    raise exception 'Anonymous SELECT unexpectedly allowed';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;
rollback;
```
