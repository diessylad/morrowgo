import { airaloRequest, requireSandbox } from './client.mjs';
export function normalizeCatalogue(rows) {
  const countries=[];
  const regions={Europe:'AX GG JE AL AD AT BY BE BA BG HR CY CZ DK EE FO FI FR DE GI GR HU IS IE IM IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH UA GB VA',Asia:'AF AM AZ BD BT BN KH CN GE HK IN ID JP KZ KG LA MO MY MV MN MM NP KP PK PH SG KR LK TW TJ TH TL TR TM UZ VN',Americas:'SX AI AG AR AW BS BB BZ BM BO BQ BR VG CA KY CL CO CR CU CW DM DO EC SV FK GF GL GD GP GT GY HT HN JM MQ MX MS NI PA PY PE PR BL KN LC MF PM VC SR TT TC US UY VE VI',Africa:'DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU YT MA MZ NA NE NG RE RW SH ST SN SC SL SO ZA SS SD TZ TG TN UG EH ZM ZW','Middle East':'BH IR IQ IL JO KW LB OM PS QA SA SY AE YE',Oceania:'AS AU CK FJ PF GU KI MH FM NR NC NZ NU NF MP PW PG PN WS SB TK TO TV UM VU WF'};
  for(const row of rows) {
    if(!/^[A-Z]{2}$/.test(row.country_code))continue;
    const packages=[];
    for(const op of row.operators||[]) for(const p of op.packages||[]) {
      const price=Number(p.prices?.recommended_retail_price?.EUR);
      if(p.type!=='sim'||!p.id||!Number.isFinite(price)||price<=0||!(Number(p.day)>0))continue;
      const networks=[...new Set((op.coverages||[]).flatMap(c=>(c.networks||[]).map(n=>n.name)).filter(Boolean))];
      const networkTypes=[...new Set((op.coverages||[]).filter(c=>c.code===row.country_code||c.name===row.country_code).flatMap(c=>(c.networks||[]).flatMap(n=>Array.isArray(n.types)?n.types:[])).filter(type=>typeof type==='string'&&type.trim()).map(type=>type.trim()))];
      packages.push({id:p.id,country:row.title,iso:row.country_code,price,currency:'EUR',dataMB:Number(p.amount)||0,dataGB:(Number(p.amount)||0)/1024,duration:Number(p.day),unlimited:!!p.is_unlimited,operator:op.title,networks,networkTypes,topupAvailable:!!op.rechargeability,packageType:op.plan_type||'data',fairUsage:p.is_fair_usage_policy?String(p.fair_usage_policy||'Fair-use policy applies'):null,title:p.title,sandbox:true});
    }
    if(packages.length)countries.push({iso:row.country_code,code:row.country_code,name:row.title,flag:[...row.country_code].map(c=>String.fromCodePoint(c.charCodeAt(0)+127397)).join(''),region:Object.entries(regions).find(([,codes])=>codes.split(' ').includes(row.country_code))?.[0]||'Other',fromPrice:Math.min(...packages.map(p=>p.price)),packages});
  }
  return countries;
}
let cached,expires=0,pending;
export async function getCatalogue() {
  requireSandbox();
  if(cached&&expires>Date.now())return cached;
  if(!pending)pending=(async()=>{
    const rows=[];
    for(let page=1;page<=30;page++) {
      const result=await airaloRequest(`/v2/packages?limit=1000&page=${page}`);
      if(!Array.isArray(result.data))throw new Error('Invalid Airalo catalogue');
      rows.push(...result.data);
      if(!result.links?.next){cached=normalizeCatalogue(rows);expires=Date.now()+300000;return cached;}
    }
    throw new Error('Incomplete Airalo catalogue');
  })().finally(()=>{pending=null;});
  return pending;
}
