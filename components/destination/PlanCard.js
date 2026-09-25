'use client';
import {ArrowRight} from 'lucide-react';
import s from './plans.module.css';
import selection from './planSelection.module.css';
export default function PlanCard({plan,recommended,formatData,onBuy,onSelect,selected=false,showSpeedDetails=false}) {
 const currency=/^[A-Z]{3}$/.test(plan.currency||'')?plan.currency:'EUR';
 let price;try{price=new Intl.NumberFormat('en-IE',{style:'currency',currency}).format(Number(plan.price));}catch{price=`${currency} ${Number(plan.price).toFixed(2)}`;}
 const speed=plan.speed || (Array.isArray(plan.networkTypes)?plan.networkTypes.join(' / '):'');
 return <article className={`${s.card} ${recommended?s.recommended:''} ${onSelect?selection.selectable:''} ${selected?selection.selected:''}`} onClick={onSelect?()=>onSelect(plan):undefined}>
  <div className={s.planInfo}>{recommended && <span className={s.badge}>MOST POPULAR</span>}<h2>{formatData(plan)}</h2><p>{plan.duration} days</p><span title={plan.networks?.join(' / ')}>{plan.operator || plan.networks?.join(' / ') || 'Local networks'}</span></div>
  <strong className={`${s.price} ${price.length>9?s.longPrice:''}`}>{price}</strong>
  <div className={s.buy}><button type="button" onClick={e=>{e.stopPropagation();(onSelect||onBuy)(plan);}} aria-pressed={onSelect?selected:undefined} aria-label={`${onSelect?'Select':'Buy'} ${formatData(plan)}, ${plan.duration} days, ${price}`}>{onSelect?(selected?'Selected':'Select plan'):'Buy now'} <ArrowRight size={17}/></button><span>{[speed, plan.packageType==='data'?'Data only':plan.packageType?'Data + calls + texts':''].filter(Boolean).join(' · ')}</span></div>
  {showSpeedDetails && plan.fairUsage && <p style={{gridColumn:"1 / -1",margin:0,fontSize:11,lineHeight:1.4,color:"#60615c"}}>{plan.fairUsage}</p>}
 </article>;
}
