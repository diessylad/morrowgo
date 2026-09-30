import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const moduleUrl=s=>'data:text/javascript;base64,'+Buffer.from(s).toString('base64');
const next=moduleUrl(`export const NextResponse={next(){return {headers:new Headers(),cookies:{getAll:()=>[],set(){}}}},redirect(url){return {url:String(url),headers:new Headers(),cookies:{set(){}}}}};`);
const supa=moduleUrl(`export function createServerClient(){return {auth:{getUser:async()=>globalThis.__authResult,getClaims:async()=>({data:{claims:{sub:'verified',session_id:'session',amr:[{method:'password',timestamp:Math.floor(Date.now()/1000)-(globalThis.__sessionAge||0)}]}}}),signOut:async()=>{}}}}`);
const cfg=moduleUrl(`export function getAuthConfig(){return globalThis.__configured?{url:'fixture',key:'fixture'}:null}`);
const lifetime=moduleUrl(await readFile(new URL('../lib/auth/lifetime.mjs',import.meta.url),'utf8'));
const source=(await readFile(new URL('../middleware.js',import.meta.url),'utf8')).replace("'./lib/auth/lifetime.mjs'",JSON.stringify(lifetime)).replace("'next/server'",JSON.stringify(next)).replace("'@supabase/ssr'",JSON.stringify(supa)).replace("'./lib/auth/config.mjs'",JSON.stringify(cfg));
const {middleware}=await import(moduleUrl(source));
for(const path of ['/account','/account/esims','/account/orders','/account/settings'])test(`guest ${path} redirects before rendering and preserves next`,async()=>{globalThis.__configured=false;const result=await middleware({url:'https://morrowgo.test'+path,nextUrl:new URL('https://morrowgo.test'+path)});const target=new URL(result.url);assert.equal(target.pathname,'/login');assert.equal(target.searchParams.get('next'),path);});
test('verified confirmed user continues; unconfirmed or failed verification redirects',async()=>{globalThis.__configured=true;const request={url:'https://morrowgo.test/account',nextUrl:new URL('https://morrowgo.test/account'),cookies:{getAll:()=>[],set(){}}};globalThis.__authResult={data:{user:{id:'verified',email_confirmed_at:'2026-01-01'}},error:null};assert.equal((await middleware(request)).url,undefined);for(const result of [{data:{user:null},error:null},{data:{user:{id:'unconfirmed'}},error:null},{data:{user:{id:'bad',email_confirmed_at:'2026-01-01'}},error:{message:'invalid'}}]){globalThis.__authResult=result;assert.ok((await middleware(request)).url.includes('/login'));}});

test('expired session redirects with preserved checkout and explanatory message; public pages remain open',async()=>{
 globalThis.__configured=true;globalThis.__sessionAge=3600;globalThis.__authResult={data:{user:{id:'verified',email_confirmed_at:'2026-01-01'}}};
 const request=path=>({url:'https://morrowgo.test'+path,nextUrl:new URL('https://morrowgo.test'+path),cookies:{getAll:()=>[],set(){}}});
 try {
  for(const path of ['/account/esims','/profile','/dashboard','/checkout?iso=JP&plan=moshi-5gb']){
   const target=new URL((await middleware(request(path))).url);
   assert.equal(target.searchParams.get('message'),'session-expired');assert.equal(target.searchParams.get('next'),path);
  }
  assert.equal((await middleware(request('/login'))).url,undefined);
 }finally{globalThis.__sessionAge=0;}
});
