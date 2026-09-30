import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sessionWithinLifetime,verifySessionLifetime} from '../lib/auth/lifetime.mjs';
const start=1800000000;
const claims={sub:'owner',session_id:'session',amr:[{method:'password',timestamp:start}]};
test('absolute hour boundary, refresh, tabs and reauthentication',()=>{
 assert.equal(sessionWithinLifetime(claims,'owner',start*1000),true);
 assert.equal(sessionWithinLifetime(claims,'owner',(start+3599)*1000),true);
 for(const age of [3600,3601,7200])assert.equal(sessionWithinLifetime(claims,'owner',(start+age)*1000),false);
 const refreshed={...claims,iat:start+3601,amr:[...claims.amr,{method:'token_refresh',timestamp:start+3601}]};
 assert.equal(sessionWithinLifetime(refreshed,'owner',(start+3601)*1000),false);
 const newLogin={...claims,session_id:'new-session',amr:[{method:'oauth',timestamp:start+3601}]};
 assert.equal(sessionWithinLifetime(newLogin,'owner',(start+3601)*1000),true);
});
test('missing, malformed, foreign, future and refresh-only evidence fails closed',()=>{
 for(const value of [null,{...claims,sub:'other'},{...claims,session_id:null},{...claims,amr:[]},{...claims,amr:[{method:'token_refresh',timestamp:start}]},{...claims,amr:[{method:'password',timestamp:String(start)}]},{...claims,amr:[{method:'password',timestamp:start+1}]}])assert.equal(sessionWithinLifetime(value,'owner',start*1000),false);
});
test('verified claims error never authorizes even if claims look valid',async()=>{
 assert.equal(await verifySessionLifetime({auth:{getClaims:async()=>({data:{claims},error:new Error('invalid signature')})}},'owner'),false);
});
