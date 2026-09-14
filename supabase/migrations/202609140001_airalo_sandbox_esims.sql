-- Additive Sandbox storage. Customer SELECT policies remain unchanged.
begin;
create table morrowgo_private.airalo_sandbox_esims (
  esim_id uuid primary key references public.customer_esims(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  iccid text not null unique,
  provider_order_id text not null,
  package_id text not null
);
alter table morrowgo_private.airalo_sandbox_esims enable row level security;
alter table morrowgo_private.airalo_sandbox_esims force row level security;
revoke all on morrowgo_private.airalo_sandbox_esims from public,anon,authenticated;
grant select,insert on morrowgo_private.airalo_sandbox_esims to service_role;
create function public.record_airalo_sandbox_esim(p_order_id uuid,p_user_id uuid,p_payload jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_order_id::text,0));
  if not exists(select 1 from public.customer_orders where id=p_order_id and user_id=p_user_id and status in ('paid','processing','awaiting_fulfillment','ready')) then
    raise exception 'Paid order owner mismatch';
  end if;
  if coalesce(p_payload->>'iccid','') !~ '^[0-9]{15,25}$' or coalesce(p_payload->>'providerOrderId','')='' then raise exception 'Invalid Sandbox eSIM'; end if;
  if exists(select 1 from public.customer_esims where id=p_order_id and (user_id<>p_user_id or order_id is distinct from p_order_id)) then raise exception 'eSIM owner mismatch'; end if;
  if exists(select 1 from morrowgo_private.airalo_sandbox_esims where esim_id=p_order_id and (iccid<>p_payload->>'iccid' or user_id<>p_user_id)) then raise exception 'eSIM reference mismatch'; end if;
  insert into public.customer_esims(id,user_id,order_id,destination_iso,plan_name,initial_data_bytes,is_unlimited,validity_days,status,networks,install_details,rechargeable)
  values(p_order_id,p_user_id,p_order_id,p_payload->>'iso',(p_payload->>'planName') || ' · Sandbox',(p_payload->>'initialDataBytes')::bigint,(p_payload->>'isUnlimited')::boolean,(p_payload->>'validityDays')::integer,'ready',array(select jsonb_array_elements_text(p_payload->'networks')),p_payload->'installDetails',false)
  on conflict(id) do nothing;
  insert into morrowgo_private.airalo_sandbox_esims(esim_id,user_id,iccid,provider_order_id,package_id)
  values(p_order_id,p_user_id,p_payload->>'iccid',p_payload->>'providerOrderId',p_payload->>'packageId') on conflict(esim_id) do nothing;
  update public.customer_orders set status='ready' where id=p_order_id and user_id=p_user_id;
  return p_order_id;
end; $$;
revoke all on function public.record_airalo_sandbox_esim(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.record_airalo_sandbox_esim(uuid,uuid,jsonb) to service_role;
create function public.get_airalo_sandbox_esim(p_esim_id uuid,p_user_id uuid)
returns jsonb language sql stable security invoker set search_path='' as $$
 select jsonb_build_object('iccid',iccid) from morrowgo_private.airalo_sandbox_esims where esim_id=p_esim_id and user_id=p_user_id;
$$;
revoke all on function public.get_airalo_sandbox_esim(uuid,uuid) from public,anon,authenticated;
grant execute on function public.get_airalo_sandbox_esim(uuid,uuid) to service_role;
commit;
