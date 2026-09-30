import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const source = await readFile(new URL('../app/api/account/esims/[id]/qr/route.js', import.meta.url), 'utf8');
const url = value => 'data:text/javascript;base64,' + Buffer.from(value).toString('base64');
async function fixture(t, options = {}) {
 const calls = []; const old = globalThis.fetch;
 const key = '__qr' + Math.random().toString(36).slice(2);
 globalThis[key] = {
  account: options.loggedOut ? {response:new Response(null,{status:401})} : {user:{id:'owner'},client:{}},
  owned: options.foreign ? {data:null} : {data:{status:options.pending?'pending':'ready'}},
  async rpc(name,args){calls.push({name,args});return {data:{iccid:'1234567890123456789'}}},
  async provider(){calls.push('provider');return {data:{iccid:'1234567890123456789',qrcode_url:options.badUrl?'https://attacker.example/qr':'https://sandbox.airalo.com/qr?token=test'}}}
 };
 globalThis.fetch = async () => {calls.push('image');return new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/png'}})};
 t.after(()=>{globalThis.fetch=old;delete globalThis[key]});
 const state = `globalThis[${JSON.stringify(key)}]`;
 const replacements = {
  '../../../../../../lib/account/api': `export async function verifiedApiAccount(){return ${state}.account} export function accountJson(body,status){return Response.json(body,{status})}`,
  '../../../../../../lib/account/readers': `export async function readCustomerEsim(){return ${state}.owned}`,
  '../../../../../../lib/supabase/admin': `export function createAdminSupabaseClient(){return ${state}}`,
  '../../../../../../lib/airalo/client.mjs': `export async function airaloRequest(){return ${state}.provider()}`
 };
 let code = source;for(const [path,stub] of Object.entries(replacements))code=code.replace(`'${path}'`,JSON.stringify(url(stub)));
 const {GET}=await import(url(code));
 return {calls,response:await GET(new Request('https://www.morrowgo.com/api/account/esims/id/qr'),{params:{id:'owned-id'}})};
}
for(const [name,options,status] of [['logged out',{loggedOut:true},401],['foreign eSIM',{foreign:true},404],['not ready',{pending:true},409]])test(`QR rejects ${name} before provider access`,async t=>{const f=await fixture(t,options);assert.equal(f.response.status,status);assert.deepEqual(f.calls,[])});
test('QR returns provider bytes privately and scopes private reference to owner',async t=>{const f=await fixture(t);assert.equal(f.response.status,200);assert.equal(f.response.headers.get('cache-control'),'private, no-store');assert.deepEqual([...new Uint8Array(await f.response.arrayBuffer())],[1,2,3]);assert.equal(f.calls[0].args.p_user_id,'owner')});
test('QR rejects non-provider URL without fetching it',async t=>{const f=await fixture(t,{badUrl:true});assert.equal(f.response.status,503);assert.equal(f.calls.includes('image'),false)});
