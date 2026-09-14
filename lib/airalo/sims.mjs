import {airaloRequest} from './client.mjs';
const cache=new Map();
export async function getSandboxSim(iccid) {
  if(!/^[0-9]{15,25}$/.test(iccid))throw new Error('Invalid eSIM identifier');
  const previous=cache.get(iccid);if(previous&&previous.until>Date.now())return previous.value;
  // Sequential requests respect the company's Sandbox rate limit.
  const usage=(await airaloRequest(`/v2/sims/${iccid}/usage`)).data;
  const instructions=(await airaloRequest(`/v2/sims/${iccid}/instructions`)).data;
  let topups=[];
  try {topups=(await airaloRequest(`/v2/sims/${iccid}/topups`)).data;}catch(e){if(e.status!==404&&e.status!==422)throw e;}
  const total=Number(usage.total),remaining=Number(usage.remaining);
  const bytes=n=>Number.isFinite(n)&&n>=0&&Number.isSafeInteger(n*1048576)?n*1048576:null;
  const steps=[];
  function collect(value,key='',depth=0){if(depth>7)return;if(typeof value==='string'&&(key==='steps'||/^\d+$/.test(key))){steps.push(value.replace(/<[^>]*>/g,'').slice(0,1500));}else if(value&&typeof value==='object')for(const [k,v]of Object.entries(value))collect(v,k,depth+1);}
  collect(instructions);
  const value={sandbox:true,remainingDataBytes:bytes(remaining),usedDataBytes:bytes(Math.max(0,total-remaining)),usageUpdatedAt:new Date().toISOString(),status:({ACTIVE:'active',NOT_ACTIVE:'ready',FINISHED:'expired',EXPIRED:'expired'})[usage.status]||'unknown',instructions:steps.slice(0,60),topups:(Array.isArray(topups)?topups:[]).filter(p=>Number(p.prices?.recommended_retail_price?.EUR)>0).map(p=>({id:p.id,title:p.title,price:Number(p.prices.recommended_retail_price.EUR),currency:'EUR'}))};
  if(cache.size>500)cache.delete(cache.keys().next().value);
  cache.set(iccid,{value,until:Date.now()+3600000});return value;
}
