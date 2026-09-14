import 'server-only';
import {createAdminSupabaseClient} from '../supabase/admin';
export async function syncAiraloEsim(orderId,session,order) {
  const client=createAdminSupabaseClient();
  const {error}=await client.rpc('record_airalo_sandbox_esim',{p_order_id:orderId,p_user_id:session.metadata.morrowgo_user_id,p_payload:{iso:order.iso,planName:order.planName,iccid:order.iccid,providerOrderId:order.orderReference,packageId:order.planId,initialDataBytes:order.plan.dataMB*1024*1024,isUnlimited:order.plan.unlimited,validityDays:order.plan.duration,networks:order.plan.networks,installDetails:order.installDetails}});
  if(error)throw new Error('Airalo account eSIM storage failed');
}

export async function enrichSandboxEsim(userId,esim) {
  const client=createAdminSupabaseClient();
  const {data,error}=await client.rpc('get_airalo_sandbox_esim',{p_esim_id:esim.id,p_user_id:userId});
  if(error)throw new Error('Sandbox reference unavailable');
  if(!data?.iccid)return esim;
  const {getSandboxSim}=await import('./sims.mjs');
  const detail=await getSandboxSim(data.iccid);
  const saved=await client.from('customer_esims').update({remaining_data_bytes:detail.remainingDataBytes,used_data_bytes:detail.usedDataBytes,usage_updated_at:detail.usageUpdatedAt,rechargeable:detail.topups.length>0}).eq('id',esim.id).eq('user_id',userId);
  if(saved.error)throw new Error('Usage storage unavailable');
  return {...esim,...detail,rechargeable:detail.topups.length>0};
}
