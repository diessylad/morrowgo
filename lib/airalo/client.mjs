// Server consumers only; credentials and tokens never leave this module.
const BASE = 'https://partners-api.airalo.com';
export function requireSandbox() {
  if (process.env.AIRALO_MODE?.trim().toLowerCase() !== 'sandbox') throw new Error('Airalo Sandbox mode is required');
  if (!process.env.AIRALO_CLIENT_ID || !process.env.AIRALO_CLIENT_SECRET) throw new Error('Airalo credentials unavailable');
}
export class AiraloError extends Error {
  constructor(status, operation) { super(`Airalo ${operation} failed`); this.name = 'AiraloError'; this.status = status; }
}
let token, expires = 0, pending;
async function accessToken() {
  requireSandbox();
  if (token && expires > Date.now()) return token;
  if (!pending) pending = (async () => {
    let response;
    try { response = await fetch(`${BASE}/v2/token`, {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded',Accept:'application/json'}, body:new URLSearchParams({client_id:process.env.AIRALO_CLIENT_ID,client_secret:process.env.AIRALO_CLIENT_SECRET,grant_type:'client_credentials'}),cache:'no-store',signal:AbortSignal.timeout(15000)}); } catch { throw new AiraloError(0,'authentication'); }
    const body = await response.json().catch(()=>null);
    if (!response.ok || !body?.data?.access_token) throw new AiraloError(response.status,'authentication');
    token = body.data.access_token;
    expires = Date.now() + Math.max(0, Math.min(Number(body.data.expires_in)||3600,86400)-60)*1000;
    return token;
  })().finally(()=>{pending=null;});
  return pending;
}
export async function airaloRequest(path, {method='GET', body}={}) {
  requireSandbox();
  if (!/^\/v2\/(packages|orders|sims)(\/|\?|$)/.test(path)) throw new Error('Invalid Airalo path');
  for (let attempt=0; attempt<3; attempt++) {
    const bearer = await accessToken();
    let response;
    try { response=await fetch(BASE+path,{method,headers:{Authorization:`Bearer ${bearer}`,Accept:'application/json','Accept-Language':'en'},body,cache:'no-store',signal:AbortSignal.timeout(25000)}); }
    catch { if(method!=='GET'||attempt===2) throw new AiraloError(0,'request'); await new Promise(r=>setTimeout(r,500*(attempt+1))); continue; }
    if (response.status===401 && method==='GET' && attempt===0) { token=null; expires=0; continue; }
    if ((response.status===429||response.status>=500)&&method==='GET'&&attempt<2) { const wait=Number(response.headers.get('retry-after')); if(wait>5)throw new AiraloError(response.status,'request'); await new Promise(r=>setTimeout(r,Math.max(500*(attempt+1),(wait||0)*1000))); continue; }
    const result=await response.json().catch(()=>null);
    if(!response.ok||!result?.data) throw new AiraloError(response.status,'request');
    return result;
  }
  throw new AiraloError(401,'request');
}
