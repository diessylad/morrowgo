-- Apply in the MORROWGO Supabase project's SQL editor after reviewing.
-- No supplier purchases, Stripe/Redis changes or guest-order claims.
begin;

create table public.customer_orders (
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

create table public.customer_esims (
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

create index customer_orders_owner_date on public.customer_orders(user_id, ordered_at desc);
create index customer_esims_owner_date on public.customer_esims(user_id, ordered_at desc);

alter table public.customer_orders enable row level security;
alter table public.customer_orders force row level security;
alter table public.customer_esims enable row level security;
alter table public.customer_esims force row level security;

revoke all on public.customer_orders, public.customer_esims from public, anon, authenticated;
grant select on public.customer_orders, public.customer_esims to authenticated;
grant all on public.customer_orders, public.customer_esims to service_role;

create policy customer_orders_read_own on public.customer_orders for select to authenticated
  using ((select auth.uid()) = user_id);
create policy customer_esims_read_own on public.customer_esims for select to authenticated
  using ((select auth.uid()) = user_id);

-- Provider names, supplier IDs, wholesale data and payment references do not
-- belong in PostgREST customer rows, even when the row has ownership RLS.
create schema if not exists morrowgo_private;
revoke all on schema morrowgo_private from public, anon, authenticated;
grant usage on schema morrowgo_private to service_role;

create table morrowgo_private.order_fulfillment (
  order_id uuid primary key references public.customer_orders(id) on delete cascade,
  stripe_session_id text unique,
  provider text,
  provider_order_id text,
  supplier_bundle_id text,
  wholesale_amount numeric,
  wholesale_currency text
);
create table morrowgo_private.esim_providers (
  esim_id uuid primary key references public.customer_esims(id) on delete cascade,
  provider text not null,
  provider_order_id text,
  provider_esim_id text,
  unique (provider, provider_esim_id)
);
alter table morrowgo_private.order_fulfillment enable row level security;
alter table morrowgo_private.esim_providers enable row level security;
revoke all on all tables in schema morrowgo_private from public, anon, authenticated;
grant all on all tables in schema morrowgo_private to service_role;

commit;
