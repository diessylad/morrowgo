import {randomUUID} from 'node:crypto';
import {getCatalogue} from './catalogue.mjs';
import {createSandboxOrder} from './orders.mjs';
import {requireSandbox} from './client.mjs';
// Redis keys match the existing flow. A permanent attempt survives lost locks and crashes.
export async function fulfillAiraloSession(session,event,redis,syncOrder,syncEsim,dependencies={}) {
  requireSandbox();
  if(event.livemode!==false||session.livemode!==false||!/^cs_test_[A-Za-z0-9_]+$/.test(session.id||'')||session.payment_status!=='paid'||session.metadata?.airalo_mode!=='sandbox')throw new Error('Sandbox paid session required');
  const customerOrderId=await syncOrder(session,event.created);
  const key=`morrowgo:order:${session.id}`,lock=`morrowgo:lock:${session.id}`,attempt=`morrowgo:fulfillment-attempt:${session.id}`,token=randomUUID();
  if(await redis(['SET',lock,token,'NX','EX','300'])!=='OK')return {received:false,retry:true};
  const persist=async order=>{const result=await redis(['EVAL',"if redis.call('GET', KEYS[1]) == ARGV[1] then redis.call('SET', KEYS[2], ARGV[2]); return 1 else return 0 end",'2',lock,key,token,JSON.stringify(order)]);if(result!==1)throw new Error('Order lock lost');};
  try {
    const raw=await redis(['GET',key]);
    let order=raw?JSON.parse(raw):null;
    if(raw&&(!order?.status||order.provider!=='airalo'))throw new Error('Unrecognized existing order');
    if(order?.orderReference){if(customerOrderId)await syncEsim(customerOrderId,session,order);return {received:true,duplicate:true};}
    if(await redis(['GET',attempt]))return {received:true,requiresReconciliation:true};
    const catalogue=await (dependencies.catalogue||getCatalogue)();
    const country=catalogue.find(c=>c.iso===session.metadata.iso);
    const plan=country?.packages.find(p=>p.id===session.metadata.plan_id);
    if(!plan||session.currency!=='eur'||session.amount_total!==Math.round(plan.price*100))throw new Error('Paid package requires reconciliation');
    order={stripeSessionId:session.id,provider:'airalo',sandbox:true,iso:country.iso,planId:plan.id,planName:plan.title,plan,amount:session.amount_total,currency:'eur',status:'fulfilling',fulfillmentStatus:'transaction_pending',createdAt:new Date().toISOString()};
    await persist(order);
    if(await redis(['SET',attempt,token,'NX'])!=='OK')return {received:true,requiresReconciliation:true};
    const result=await (dependencies.createOrder||createSandboxOrder)(plan.id,session.id);
    order={...order,...result,status:'ready',fulfillmentStatus:'ready',updatedAt:new Date().toISOString()};
    await persist(order);
    if(customerOrderId)await syncEsim(customerOrderId,session,order);
    return {received:true};
  } finally {try{await redis(['EVAL',"if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end",'1',lock,token]);}catch{}}
}
