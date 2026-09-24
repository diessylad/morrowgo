import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCatalogue} from '../lib/airalo/catalogue.mjs';
const getPlan=coverages=>normalizeCatalogue([{country_code:'JP',title:'Japan',operators:[{coverages,packages:[{id:'real-schema',type:'sim',day:7,amount:1024,prices:{recommended_retail_price:{EUR:4}}}]}]}])[0].packages[0];
test('network types retain provider values, deduplicate and use destination coverage',()=>{
 const plan=getPlan([{code:'JP',networks:[{name:'A',types:['5G','LTE']},{name:'B',types:['5G']}]},{code:'US',networks:[{name:'C',types:['3G']}]}]);
 assert.deepEqual(plan.networkTypes,['5G','LTE']);assert.equal(plan.price,4);
});
test('missing network types do not invent speed claims',()=>{
 assert.deepEqual(getPlan([]).networkTypes,[]);
 assert.deepEqual(getPlan([{code:'JP',networks:[{name:'A'}]}]).networkTypes,[]);
});
