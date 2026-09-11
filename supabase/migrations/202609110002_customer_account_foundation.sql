-- Customer database foundation only. Run this entire file in Supabase SQL Editor.
-- Works on a fresh project or after 202609110001_customer_accounts.sql.
-- Existing customer rows are preserved. Existing tables must match the schema
-- from migration 001; an unrelated pre-existing schema is not upgraded here.
-- No auth triggers, user backfill, provider integration or application changes.
begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 160),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  destination_iso text check (destination_iso ~ '^[A-Z]{2}$'),
  plan_name text,
  ordered_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'paid', 'processing', 'awaiting_fulfillment', 'ready', 'failed', 'cancelled', 'refunded', 'unknown')),
  amount_total bigint check (amount_total between 0 and 9007199254740991),
  currency text check (currency ~ '^[A-Z]{3}$'),
  unique (id, user_id)
);

create table if not exists public.customer_esims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid,
  destination_iso text check (destination_iso ~ '^[A-Z]{2}$'),
  destination_name text,
  plan_name text,
  initial_data_bytes bigint check (initial_data_bytes between 0 and 9007199254740991),
  remaining_data_bytes bigint check (remaining_data_bytes between 0 and 9007199254740991),
  used_data_bytes bigint check (used_data_bytes between 0 and 9007199254740991),
  is_unlimited boolean not null default false,
  validity_days integer check (validity_days >= 0),
  activated_at timestamptz,
  expires_at timestamptz,
  usage_updated_at timestamptz,
  ordered_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'processing', 'awaiting_fulfillment', 'ready', 'active', 'expired', 'suspended', 'cancelled', 'failed', 'unknown')),
  networks text[] not null default '{}',
  supports_5g boolean,
  rechargeable boolean not null default false,
  install_details jsonb check (
    install_details is null or (
      jsonb_typeof(install_details) = 'object'
      and install_details - array['smdpAddress', 'activationCode', 'confirmationCode']::text[] = '{}'::jsonb
      and (not install_details ? 'smdpAddress' or jsonb_typeof(install_details->'smdpAddress') in ('string', 'null'))
      and (not install_details ? 'activationCode' or jsonb_typeof(install_details->'activationCode') in ('string', 'null'))
      and (not install_details ? 'confirmationCode' or jsonb_typeof(install_details->'confirmationCode') in ('string', 'null'))
    )
  ),
  foreign key (order_id, user_id) references public.customer_orders(id, user_id)
);

create index if not exists customer_orders_owner_date on public.customer_orders(user_id, ordered_at desc);
create index if not exists customer_esims_owner_date on public.customer_esims(user_id, ordered_at desc);

-- Replace policies only on these three foundation tables. Leaving an old
-- permissive policy would otherwise OR with the owner-only SELECT policy.
do $policies$
declare
  existing_policy record;
begin
  for existing_policy in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in ('profiles', 'customer_orders', 'customer_esims')
  loop
    execute format('drop policy %I on %I.%I',
      existing_policy.policyname, existing_policy.schemaname, existing_policy.tablename);
  end loop;
end
$policies$;

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.customer_orders enable row level security;
alter table public.customer_orders force row level security;
alter table public.customer_esims enable row level security;
alter table public.customer_esims force row level security;

revoke all on table public.profiles, public.customer_orders, public.customer_esims
  from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select on table public.profiles, public.customer_orders, public.customer_esims
  to authenticated;
-- Only a trusted server/admin can populate these tables. No new write flow is added.
grant select, insert, update, delete on table
  public.profiles, public.customer_orders, public.customer_esims to service_role;

create policy profiles_read_own on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy customer_orders_read_own on public.customer_orders
  for select to authenticated using ((select auth.uid()) = user_id);
create policy customer_esims_read_own on public.customer_esims
  for select to authenticated using ((select auth.uid()) = user_id);

-- There are intentionally no INSERT, UPDATE or DELETE client policies.
-- Profiles, orders and eSIMs are populated later by trusted server-side code.
commit;
