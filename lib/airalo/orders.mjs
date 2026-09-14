import { airaloRequest } from './client.mjs';
// Call only after durable attempt reservation. POST is deliberately never retried.
export async function createSandboxOrder(packageId, description) {
  if(!/^[\w.-]{1,255}$/.test(packageId))throw new Error('Invalid package');
  const body=new FormData();
  body.set('quantity','1');body.set('package_id',packageId);body.set('type','sim');body.set('description',String(description).slice(0,200));
  const {data}=await airaloRequest('/v2/orders',{method:'POST',body});
  if(!data.id||!data.sims?.[0]?.iccid)throw new Error('Airalo order needs reconciliation');
  const sim=data.sims[0];
  return {orderReference:String(data.id),packageId,iccid:String(sim.iccid),sandbox:true,installDetails:{smdpAddress:sim.lpa||null,activationCode:sim.matching_id||null,confirmationCode:sim.confirmation_code||null}};
}
