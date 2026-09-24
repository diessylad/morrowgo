import {test} from 'node:test';
import assert from 'node:assert/strict';
import {selectPlans} from '../components/quick-buy/selectPlans.mjs';
const fixed=[1,2,3,5,10,20].map(n=>({id:`f${n}`,dataGB:n,price:n,duration:30,unlimited:false}));
const unlimited=[3,5,7,10,15,30].map(n=>({id:`u${n}`,price:n,duration:n,unlimited:true}));
test('five separate fixed and unlimited choices with original IDs',()=>{
 assert.deepEqual(selectPlans([...fixed,...unlimited]).map(p=>p.id),['f1','f3','f5','f10','f20']);
 assert.deepEqual(selectPlans([...fixed,...unlimited],'unlimited').map(p=>p.id),['u3','u5','u7','u15','u30']);
});
test('no fabricated packages or cross-category fallbacks',()=>{
 assert.equal(selectPlans(fixed,'unlimited').length,0);
 assert.equal(selectPlans(unlimited).length,0);
 assert.equal(selectPlans(fixed.slice(0,2)).length,2);
});
test('duplicate allowances choose the cheapest, not duplicate cards',()=>{
 const result=selectPlans([...fixed,{...fixed[0],id:'expensive',price:99}]);
 assert.equal(result.length,5);assert.equal(result[0].id,'f1');
});
