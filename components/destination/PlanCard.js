'use client';
import { Text, Localized, useLanguage } from './../i18n/Provider';
import en from './../../locales/en.json';
import {ArrowRight} from 'lucide-react';
import s from './plans.module.css';
import selection from './planSelection.module.css';
import { InteractiveCard } from '../shared/MotionPrimitives';
export default function PlanCard({plan,recommended,formatData,onBuy,onSelect,selected=false,showSpeedDetails=false}) {
  const { language } = useLanguage();
 const currency=/^[A-Z]{3}$/.test(plan.currency||'')?plan.currency:'EUR';
 let price;try{price=new Intl.NumberFormat(language === 'en' ? 'en-IE' : language,{style:'currency',currency}).format(Number(plan.price));}catch{price=`${currency} ${Number(plan.price).toFixed(2)}`;}
 const speed=plan.speed || (Array.isArray(plan.networkTypes)?plan.networkTypes.join(' / '):'');
 return <InteractiveCard className={`${s.card} ${recommended?s.recommended:''} ${onSelect?selection.selectable:''} ${selected?selection.selected:''}`} onClick={onSelect?()=>onSelect(plan):undefined}>
  <div className={s.planInfo}><Text>{recommended && <span className={s.badge}><Text>{en["m_7994f65b9f0e"]}</Text></span>}</Text><h2><Text>{formatData(plan)}</Text></h2><p><Text>{`${plan.duration} days`}</Text></p><span title={plan.networks?.join(' / ')}>{plan.operator || plan.networks?.join(' / ') || <Text>{en["m_21fcc6de8b55"]}</Text>}</span></div>
  <strong className={`${s.price} ${price.length>9?s.longPrice:''}`}><Text>{price}</Text></strong>
  <div className={s.buy}><Localized as="button" type="button" onClick={e=>{e.stopPropagation();(onSelect||onBuy)(plan);}} aria-pressed={onSelect?selected:undefined} aria-label={`${onSelect?'Select':'Buy'} ${formatData(plan)}, ${plan.duration} days, ${price}`}><Text>{onSelect?(selected?en["m_9a976fc228b6"]:en["m_4e6b8148c65a"]):en["m_c38860a3ba58"]}</Text> <ArrowRight size={17}/></Localized><span><Text>{[speed, plan.packageType==='data'?en["m_c646cf24f147"]:plan.packageType?en["m_562e6da06518"]:''].filter(Boolean).join(' · ')}</Text></span></div>
  <Text>{showSpeedDetails && plan.fairUsage && <p style={{gridColumn:"1 / -1",margin:0,fontSize:11,lineHeight:1.4,color:"#60615c"}}><Text>{plan.fairUsage}</Text></p>}</Text>
 </InteractiveCard>;
}
