-- Run after 202609110002_customer_account_foundation.sql.
-- This records paid account orders only. It does not create eSIMs, claim guest
-- orders, change customer policies, or call Stripe, Redis or a supplier.
begin;

create schema if not exists morrowgo_private;
revoke all on schema morrowgo_private from public, anon, authenticated;
grant usage on schema morrowgo_private to service_role;

-- Payment references are deliberately absent from customer-visible tables.
create table if not exists morrowgo_private.stripe_customer_orders (
  stripe_session_id text primary key check (
    char_length(stripe_session_id) <= 255
    and stripe_session_id ~ '^cs_(test_|live_)?[A-Za-z0-9_]+$'
  ),
  order_id uuid not null unique,
  user_id uuid not null,
  created_at timestamptz not null default now(),
  foreign key (order_id, user_id)
    references public.customer_orders(id, user_id) on delete cascade
);

alter table morrowgo_private.stripe_customer_orders enable row level security;
alter table morrowgo_private.stripe_customer_orders force row level security;
revoke all on table morrowgo_private.stripe_customer_orders from public, anon, authenticated;
grant select, insert on table morrowgo_private.stripe_customer_orders to service_role;

create or replace function public.record_paid_customer_order(
  p_stripe_session_id text,
  p_user_id uuid,
  p_destination_iso text,
  p_plan_name text,
  p_amount_total bigint,
  p_currency text,
  p_ordered_at timestamptz
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  existing_order_id uuid;
  existing_user_id uuid;
begin
  if p_stripe_session_id is null
    or pg_catalog.char_length(p_stripe_session_id) > 255
    or p_stripe_session_id !~ '^cs_(test_|live_)?[A-Za-z0-9_]+$'
    or p_user_id is null
    or p_destination_iso is null or p_destination_iso !~ '^[A-Z]{2}$'
    or p_plan_name is null or pg_catalog.char_length(pg_catalog.btrim(p_plan_name)) = 0
    or pg_catalog.char_length(p_plan_name) > 500
    or p_amount_total is null or p_amount_total < 0 or p_amount_total > 9007199254740991
    or p_currency is null or p_currency !~ '^[A-Z]{3}$'
    or p_ordered_at is null or not pg_catalog.isfinite(p_ordered_at)
    or p_ordered_at < '1970-01-01 00:00:00+00'::timestamptz
    or p_ordered_at > pg_catalog.now() + interval '1 day'
  then
    raise exception 'Invalid paid customer order' using errcode = '22023';
  end if;

  -- Serialize deliveries of one Checkout Session within this database
  -- transaction. The separate Redis fulfillment lock remains untouched.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('morrowgo:stripe-order:' || p_stripe_session_id, 0)
  );

  select order_id, user_id into existing_order_id, existing_user_id
  from morrowgo_private.stripe_customer_orders
  where stripe_session_id = p_stripe_session_id;

  if found then
    if existing_user_id <> p_user_id then
      raise exception 'Paid customer order owner mismatch' using errcode = '22023';
    end if;

    update public.customer_orders
    set destination_iso = p_destination_iso,
        plan_name = p_plan_name,
        amount_total = p_amount_total,
        currency = p_currency,
        ordered_at = p_ordered_at,
        status = case when status in ('pending', 'unknown') then 'paid' else status end
    where id = existing_order_id and user_id = p_user_id;
    if not found then
      raise exception 'Paid customer order unavailable' using errcode = '22023';
    end if;
  else
    insert into public.customer_orders(
      user_id, destination_iso, plan_name, amount_total, currency, ordered_at, status
    ) values (
      p_user_id, p_destination_iso, p_plan_name, p_amount_total, p_currency, p_ordered_at, 'paid'
    ) returning id into existing_order_id;

    insert into morrowgo_private.stripe_customer_orders(stripe_session_id, order_id, user_id)
    values (p_stripe_session_id, existing_order_id, p_user_id);
  end if;

  return existing_order_id;
end;
$function$;

-- PostgreSQL grants function EXECUTE to PUBLIC by default. Remove it before
-- committing so a browser JWT can never invoke this trusted write operation.
revoke all on function public.record_paid_customer_order(text, uuid, text, text, bigint, text, timestamptz)
  from public, anon, authenticated;
grant execute on function public.record_paid_customer_order(text, uuid, text, text, bigint, text, timestamptz)
  to service_role;

commit;
