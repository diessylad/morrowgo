import { accountJson, verifiedApiAccount } from '../../../../../../lib/account/api';
import { readCustomerEsim } from '../../../../../../lib/account/readers';
import { createAdminSupabaseClient } from '../../../../../../lib/supabase/admin';
import { airaloRequest } from '../../../../../../lib/airalo/client.mjs';
export const dynamic = 'force-dynamic';
export async function GET(request, { params }) {
 const account = await verifiedApiAccount();
 if (account.response) return account.response;
 const owned = await readCustomerEsim(account.client, account.user.id, params.id);
 if (owned.error === 'invalid_id' || (!owned.error && !owned.data)) return accountJson({error:'not_found'},404);
 if (owned.error) return accountJson({error:'unavailable'},503);
 if (!['ready','active'].includes(owned.data.status)) return accountJson({error:'installation_not_ready'},409);
 try {
  const admin = createAdminSupabaseClient();
  const reference = await admin.rpc('get_airalo_sandbox_esim', {p_esim_id: params.id, p_user_id: account.user.id});
  if (reference.error) throw new Error('Reference unavailable');
  const iccid = reference.data?.iccid;
  if (!/^[0-9]{15,25}$/.test(iccid || '')) return accountJson({error:'qr_unavailable'},404);
  const {data} = await airaloRequest(`/v2/sims/${iccid}`);
  if (String(data?.iccid) !== iccid || !data.qrcode_url) return accountJson({error:'qr_unavailable'},404);
  // Proxy only the actual provider image. Never expose the signed URL or invent QR contents.
  const url = new URL(data.qrcode_url);
  if (url.protocol !== 'https:' || !['airalo.com','www.airalo.com','sandbox.airalo.com'].includes(url.hostname) || url.pathname !== '/qr' || url.port || url.username || url.password) throw new Error('Invalid provider image');
  const image = await fetch(url, {cache:'no-store',redirect:'error',signal:AbortSignal.timeout(15000)});
  const type = image.headers.get('content-type')?.split(';')[0];
  if (!image.ok || !['image/png','image/jpeg','image/webp'].includes(type)) throw new Error('Image unavailable');
  const bytes = await image.arrayBuffer();
  if (bytes.byteLength > 2 * 1024 * 1024) throw new Error('Image too large');
  return new Response(bytes,{headers:{'Content-Type':type,'Cache-Control':'private, no-store','Vary':'Cookie','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}});
 } catch { return accountJson({error:'qr_unavailable'},503); }
}
