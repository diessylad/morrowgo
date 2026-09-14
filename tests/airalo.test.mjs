import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCatalogue} from '../lib/airalo/catalogue.mjs';
import {fulfillAiraloSession} from '../lib/airalo/fulfillment.mjs';
import {airaloRequest} from '../lib/airalo/client.mjs';
const plan={id:'japan-1gb',price:4,currency:'EUR',dataMB:1024,duration:7};
function fixture(options={}) {
 process.env.AIRALO_MODE='sandbox';process.env.AIRALO_CLIENT_ID='fixture';process.env.AIRALO_CLIENT_SECRET='fixture';
 const db=new Map();let orders=0,syncs=0;
 const redis=async ([cmd,key,value,...rest])=>{
 if(options.redisFail)throw Error('unavailable');
 if(cmd==='GET')return db.get(key)||null;
 if(cmd==='SET'){if(rest.includes('NX')&&db.has(key))return null;db.set(key,value);return 'OK';}
 if(cmd==='EVAL'){if(value==='1'){if(db.get(rest[0])===rest[1])db.delete(rest[0]);return 1;}
 const [lock,orderKey,token,body]=rest;if(db.get(lock)!==token)return 0;
 if(options.saveFail&&JSON.parse(body).orderReference)throw Error('write failed');db.set(orderKey,body);return 1;}
 throw Error('unexpected');};
 const session={id:'cs_test_airalo',livemode:false,payment_status:'paid',currency:'eur',amount_total:400,metadata:{iso:'JP',plan_id:plan.id,provider:'airalo',airalo_mode:'sandbox'}};
 const run=()=>fulfillAiraloSession(session,{livemode:false},redis,async()=>options.guest?null:'order',async()=>{syncs++;if(options.accountFail)throw Error('storage');},{catalogue:async()=>[{iso:'JP',packages:[plan]}],createOrder:async()=>{orders++;if(options.uncertain)throw Error('timeout');return {orderReference:'1',iccid:'8910000000000000000',installDetails:{}};}});
 return {run,session,db,get orders(){return orders;},get syncs(){return syncs;}};
}
test('catalogue uses EUR retail, omits topups and missing prices',()=>{const op={packages:[{id:'a',type:'sim',day:7,amount:1024,prices:{recommended_retail_price:{EUR:4},net_price:{EUR:1}}},{id:'b',type:'sim',day:7,price:1},{id:'c',type:'topup',day:7,prices:{recommended_retail_price:{EUR:1}}}]};const c=normalizeCatalogue([{country_code:'JP',title:'Japan',operators:[op]}]);assert.equal(c[0].packages.length,1);assert.equal(c[0].fromPrice,4);assert.equal(c[0].packages[0].dataGB,1);});
test('duplicate webhooks create one order and repair account sync',async()=>{const f=fixture();await f.run();await f.run();assert.equal(f.orders,1);assert.equal(f.syncs,2);});
test('guest order never invokes account eSIM storage',async()=>{const f=fixture({guest:true});await f.run();assert.equal(f.orders,1);assert.equal(f.syncs,0);});
for(const option of ['uncertain','saveFail','accountFail'])test(`${option}: permanent attempt prevents a second purchase`,async()=>{const f=fixture({[option]:true});await assert.rejects(f.run());await f.run().catch(()=>{});assert.equal(f.orders,1);});
test('Redis failure cannot place order',async()=>{const f=fixture({redisFail:true});await assert.rejects(f.run());assert.equal(f.orders,0);});
test('live Stripe session cannot place order',async()=>{const f=fixture();f.session.livemode=true;await assert.rejects(f.run());assert.equal(f.orders,0);});
test('wrong amount fails closed',async()=>{const f=fixture();f.session.amount_total=1;await assert.rejects(f.run());assert.equal(f.orders,0);});
test('production env cannot access Airalo',async()=>{fixture();process.env.AIRALO_MODE='production';await assert.rejects(airaloRequest('/v2/packages'));process.env.AIRALO_MODE='sandbox';});
test('HTTP client refreshes 401 once, reuses token, and never retries POST',async t=>{
 fixture();const original=globalThis.fetch;t.after(()=>{globalThis.fetch=original;});let tokens=0,reads=0,writes=0;
 globalThis.fetch=async (url,init)=>{
 if(url.endsWith('/token')){tokens++;return Response.json({data:{access_token:'fixture-token',expires_in:3600}});}
 if(init.method==='POST'){writes++;return Response.json({error:'fixture'},{status:503});}
 reads++;return reads===1?Response.json({error:'expired'},{status:401}):Response.json({data:[]});};
 await airaloRequest('/v2/packages');await airaloRequest('/v2/packages');assert.equal(tokens,2);assert.equal(reads,3);
 await assert.rejects(airaloRequest('/v2/orders',{method:'POST',body:new FormData()}));assert.equal(writes,1);
});
