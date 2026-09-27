import test from 'node:test';
import assert from 'node:assert/strict';
import { accountProfile, dashboardSummary, daysRemaining, countryFlag, aggregateRemaining, esimStatus } from '../lib/account/presentation.mjs';
test('profile only returns display fields and respects explicitly cleared names',()=>{
 const p=accountProfile({email:'a@example.com',id:'secret-id',user_metadata:{first_name:'',last_name:'',name:'Old Name',admin:true}});
 assert.equal(p.name,''); assert.equal(p.initials,'M'); assert.equal(p.id,undefined); assert.equal(p.admin,undefined);
 assert.deepEqual(accountProfile({user_metadata:{name:'Alex Morgan'}}),{firstName:'Alex',lastName:'Morgan',name:'Alex Morgan',email:'',initials:'AM'});
});
test('expired active rows do not become the featured connection; countries deduplicate',()=>{
 const now='2026-09-27T00:00:00Z';
 const records=[{id:1,status:'active',destinationIso:'JP',expiresAt:'2026-09-01'}, {id:2,status:'active',destinationIso:'JP',expiresAt:'2026-10-01'},{id:3,status:'ready',destinationIso:'DE'}];
 const summary=dashboardSummary(records,now); assert.equal(summary.focus.id,2);assert.equal(summary.activeCount,1);assert.equal(summary.countries,1);
});
test('unknown expiry is not manufactured from validity; ready is fallback, not active',()=>{
 assert.equal(daysRemaining({validityDays:30},'2026-09-27'),null);
 assert.equal(daysRemaining({expiresAt:'2026-09-28'},'2026-09-27'),1);
 const ready={status:'ready',destinationIso:'JP'};assert.equal(dashboardSummary([ready],'2026-09-27').activeCount,0);assert.equal(dashboardSummary([ready],'2026-09-27').focus,ready);
 assert.equal(dashboardSummary([],'2026-09-27').focus,null);
 assert.equal(countryFlag('JP'),'🇯🇵');assert.equal(countryFlag('<x>'),'◎');
});

test('remaining total excludes expired plans and never invents missing counters',()=>{
 const now='2026-09-27';
 assert.deepEqual(aggregateRemaining([{status:'active',remainingDataBytes:0},{status:'ready',remainingDataBytes:1000},{status:'expired',remainingDataBytes:9000}],now),{kind:'known',bytes:1000});
 assert.deepEqual(aggregateRemaining([{status:'active',remainingDataBytes:null}],now),{kind:'unknown',bytes:null});
 assert.deepEqual(aggregateRemaining([{status:'ready',isUnlimited:true}],now),{kind:'unlimited',bytes:null});
 assert.equal(esimStatus({status:'active',expiresAt:'2026-09-01'},now),'expired');
 assert.deepEqual(aggregateRemaining([{status:'active',remainingDataBytes:Number.MAX_SAFE_INTEGER},{status:'active',remainingDataBytes:1}],now),{kind:'unknown',bytes:null});
});
