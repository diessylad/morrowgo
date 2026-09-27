'use client';
import Link from 'next/link';
import { Text, useLanguage } from '../i18n/Provider';
import en from '../../locales/en.json';
import { countryFlag, countryName } from '../../lib/account/presentation.mjs';
import s from './dashboard.module.css';
const labels = { paid: en["m_dc9d4584a554"], pending: en["m_96f608c16cef"], processing: en["m_e63451d3cf90"], awaiting_fulfillment: en["m_944ea5e9b0a7"], validated: en["m_944ea5e9b0a7"], fulfilling: en["m_ed87f9a4a1f0"], ready: en["m_20c7c5522fc2"], completed: en["m_1798b3ba42ee"], refunded: en["m_d6fbc7a82d1c"], cancelled: en["m_a1bf92eff40d"], failed: en["m_a126722ec044"], validation_failed: en["m_a126722ec044"], fulfillment_failed: en["m_a126722ec044"], payment_pending: en["m_9a08b57abd6c"] };
export default function OrderList({orders,compact=false,query=''}) {
 const {language,t}=useLanguage();
 const filtered=orders.filter(o=>!query||[o.id,o.planName,o.destinationIso,countryName(o,language),countryName(o,'en')].some(v=>String(v||'').toLocaleLowerCase(language).includes(query.toLocaleLowerCase(language))));
 if(!filtered.length)return <p className={s.fine}><Text>No matching orders.</Text> <Link href="/account/orders"><Text>View all</Text></Link></p>;
 return <div className={s.tableWrap}><table className={s.orderTable}><thead><tr>{['Date','Destination','Plan','Amount','Status'].map(label=><th scope="col" key={label}><Text>{label}</Text></th>)}</tr></thead><tbody>{filtered.map(order=>{
  const time=Date.parse(order.orderedAt);
  const date=Number.isFinite(time)?new Intl.DateTimeFormat(language==='en'?'en-GB':language,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(time):'—';
  let price='—';
  if(Number.isSafeInteger(order.amountTotal)&&order.amountTotal>=0&&/^[A-Z]{3}$/.test(order.currency||'')){
   try{const format=new Intl.NumberFormat(language,{style:'currency',currency:order.currency});const digits=format.resolvedOptions().maximumFractionDigits;price=format.format(order.amountTotal/10**digits);}catch{}
  }
  return <tr key={order.id}><td data-label={t('Date')}>{date}{!compact&&<details className={s.orderReference}><summary><Text>Order reference</Text></summary><span>{order.id}</span></details>}</td><td data-label={t('Destination')}><span className={s.country}><span className={s.flag} aria-hidden="true">{countryFlag(order.destinationIso)}</span><span>{countryName(order,language)}</span></span></td><td data-label={t('Plan')}>{order.planName||'—'}{order.validityDays!=null&&<small>{order.validityDays} <Text>days</Text></small>}</td><td data-label={t('Amount')}>{price}</td><td data-label={t('Status')}><span className={s.status} data-active={['ready','completed'].includes(order.status)}><i/><Text>{labels[order.status]||en["m_f261ff7629df"]}</Text></span></td></tr>;
 })}</tbody></table></div>;
}
