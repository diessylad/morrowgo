import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalizeCatalogue} from '../lib/airalo/catalogue.mjs';

const row = code => ({country_code:code,title:code,operators:[{packages:[{id:`plan-${code}`,type:'sim',day:7,amount:1024,prices:{recommended_retail_price:{EUR:4}}}]}]});
const groups = {
  Africa:['EG','ZA','MA','NG','KE','RE'],
  'Middle East':['AE','SA','QA','IL','BH','IR','IQ','JO','KW','LB','OM','PS','SY','YE'],
  Oceania:['AU','NZ','FJ','PF','GU','NC','WS'],
  Europe:['DE','FR','JE','GG','AX'],
  Asia:['JP','IN','TH'],
  Americas:['US','BR','SX'],
};
for (const [region,codes] of Object.entries(groups)) {
  test(`normalizes ${region} country codes`,()=>{
    for(const destination of normalizeCatalogue(codes.map(row))) {
      assert.equal(destination.region,region,destination.code);
      assert.equal(destination.fromPrice,4);
      assert.equal(destination.packages.length,1);
      assert.equal(destination.packages[0].currency,'EUR');
    }
  });
}
test('retains fallback for unrecognized codes without inventing a region',()=>{
  assert.equal(normalizeCatalogue([row('ZZ')])[0].region,'Other');
});
