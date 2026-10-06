'use client';
import Link from '../shared/ReturnAwareLink';
import { ChevronRight, Smartphone, Globe2, ShoppingBag, ChartPie, UserRound, Headphones, CreditCard, Radio, Signal } from 'lucide-react';
import { Text, Message, useLanguage } from '../i18n/Provider';
import { dashboardSummary, accountProfile, countryFlag, countryName, daysRemaining, aggregateRemaining, esimStatus } from '../../lib/account/presentation.mjs';
import { getUsageSummary, formatDataBytes } from '../../lib/esims/usage';
import OrderList from './OrderList';
import s from './dashboard.module.css';
import MobileEsimRow from './MobileEsimRow';
import mobile from './mobileEsim.module.css';
import MobileDashboard from './MobileDashboard';
const statusLabels = {active:'Active',ready:'Ready to install',expired:'Expired',depleted:'Used',pending:'Pending',processing:'Processing',suspended:'Suspended',cancelled:'Cancelled',failed:'Failed'};
export function StatusPill({status,asOf,esim}) {
 const state=esim?esimStatus(esim,asOf):status;
 return <span className={s.status} data-active={state==='active'}><i/><Text>{statusLabels[state]||'Status unavailable'}</Text></span>;
}
export function EsimRows({esims,asOf}) {
 const {language,t}=useLanguage();
 return <><div className={mobile.list}>{esims.map(e=><MobileEsimRow key={e.id} esim={e} asOf={asOf}/>)}</div><div className={`${s.tableWrap} ${mobile.desktop}`}><table className={s.esimTable}><thead><tr>{['Destination','Plan','Data remaining','Days left','Status'].map(label=><th scope="col" key={label}><Text>{label}</Text></th>)}<th><span className={s.srOnly}><Text>View eSIM</Text></span></th></tr></thead><tbody>{esims.map(e=>{const usage=getUsageSummary(e),days=daysRemaining(e,asOf);return <tr key={e.id}>
 <td data-label={t('Destination')}><Link href={`/account/esims#esim-${e.id}`} className={s.country}><span className={s.flag} aria-hidden="true">{countryFlag(e.destinationIso)}</span><span>{countryName(e,language)}</span></Link></td>
 <td data-label={t('Plan')}><strong>{usage.initialLabel?<Text>{usage.initialLabel}</Text>:e.planName||'—'}</strong><small>{e.validityDays!=null?<Message message="{days} days" values={{days:e.validityDays}}/>:'—'}</small></td>
 <td data-label={t('Data remaining')}><strong>{usage.isUnlimited?<Text>Unlimited</Text>:usage.remainingLabel||'—'}</strong>{usage.remainingPercent!=null&&<div className={s.miniProgress} aria-label={t('Data remaining')}><span style={{width:`${usage.remainingPercent}%`}}/></div>}</td>
 <td data-label={t('Days left')}>{days!=null?<Message message="{days} days" values={{days}}/>:'—'}</td><td data-label={t('Status')}><StatusPill esim={e} asOf={asOf}/></td><td><Link className={s.rowAction} aria-label={`${t('View eSIM')} · ${countryName(e,language)}`} href={`/account/esims#esim-${e.id}`}><ChevronRight size={17}/></Link></td>
 </tr>;})}</tbody></table></div></>;
}
function SectionHeading({title,href}) {return <div className={s.sectionTitle}><h2><Text>{title}</Text></h2>{href&&<Link href={href}><Text>View all</Text><ChevronRight size={16}/></Link>}</div>;}
function DataState({unavailable,kind}) {return <div className={s.dataState}><Smartphone size={26} strokeWidth={1.4}/><h3><Text>{unavailable?'Your data is temporarily unavailable.':kind==='orders'?'No orders yet.':kind==='inactive'?'No active eSIM':'No eSIMs yet.'}</Text></h3><p><Text>{unavailable?'Please try again later or contact support.':kind==='inactive'?'View your eSIMs for installation and status details.':'Your next connection starts here.'}</Text></p><Link className={s.cta} href={unavailable?'/help#contact':kind==='inactive'?'/account/esims':'/destinations'}><Text>{unavailable?'Contact support':kind==='inactive'?'My eSIMs':'Find your eSIM'}</Text><ChevronRight size={16}/></Link></div>;}
export function PaymentMethodsCard({full=false}) {
 const {t}=useLanguage();
 return <section className={s.smallCard}><div className={s.smallTitle}><CreditCard size={19}/><h2><Text>Payment methods</Text></h2></div><div className={s.smallBody}><div><p><Text>Choose your payment method at checkout.</Text></p>{full&&<p className={s.fine}><Text>Saved payment methods are not available yet.</Text></p>}</div>{!full&&<Link href="/account/payment-methods" aria-label={t("Payment methods")} className={s.rowAction}><ChevronRight size={18}/></Link>}</div></section>;
}
function CurrentPlan({esim,asOf,unavailable,hasEsims}) {
 const {language,t}=useLanguage();
 const usage=getUsageSummary(esim),days=esim?daysRemaining(esim,asOf):null;
 return <section className={s.currentPlan} data-ready={esim?.status==='ready'}><img className={s.planArtwork} src="/images/current-plan-esim-cluster.png" alt="" aria-hidden="true" draggable={false}/><SectionHeading title="Current Plan"/>{esim?<div className={s.planVisual}>
  <div className={s.planTop}><span className={s.flag} aria-hidden="true">{countryFlag(esim.destinationIso)}</span><div><strong>{countryName(esim,language)}</strong><small>{usage.initialLabel||esim.planName||'—'}{esim.validityDays!=null&&<> · <Message message="{days} days" values={{days:esim.validityDays}}/></>}</small></div>{esim.supports5G===true&&<span className={s.networkBadge}>5G</span>}</div>
  {esim.status==='ready'&&<div className={s.mobileReady}><StatusPill esim={esim} asOf={asOf}/><p><Text>Usage will appear after activation.</Text></p></div>}
  <div className={s.planBalance}><div className={s.ring} role={usage.remainingPercent!=null?'progressbar':undefined} aria-label={t('Data remaining')} aria-valuenow={usage.remainingPercent!=null?Math.round(usage.remainingPercent):undefined} aria-valuemin={0} aria-valuemax={100} style={{'--progress':`${usage.remainingPercent??0}%`}}><span><strong>{usage.remainingPercent!=null?`${Math.round(usage.remainingPercent)}%`:'—'}</strong><small><Text>remaining</Text></small></span></div><div><strong>{usage.isUnlimited?<Text>Unlimited</Text>:usage.remainingLabel||'—'}</strong><small>{usage.initialLabel?<Message message="of {data} remaining" values={{data:usage.initialLabel}}/>:<Text>Data remaining</Text>}</small><hr/><p>{days!=null?<Message message="{days} days left" values={{days}}/>:<Text>{esim.status==='ready'?'Not started':'Expiry not reported'}</Text>}</p></div></div>
  <div className={s.networkDetails}><div><Radio size={20}/><span><small><Text>Operator</Text></small><strong>{esim.networks?.join(' / ')||'—'}</strong></span></div><div><Signal size={20}/><span><small><Text>Network</Text></small><strong>{esim.supports5G===true?'5G':'—'}</strong></span></div></div>
  {esim.status==='ready' && <p className={s.installPrompt}><Text>{esim.sandbox?'View your test eSIM and installation details.':'Your next step: open the installation guide.'}</Text></p>}
  <Link className={s.cta} href={esim.status==='ready'?`/account/esims?install=${encodeURIComponent(esim.id)}#esim-${esim.id}`:`/account/esims#esim-${esim.id}`}><Text>{esim.status==='ready'?'View installation details':'Manage eSIM'}</Text><ChevronRight size={16}/></Link><p className={s.usageNote}><Text>{esim.usageUpdatedAt?'Latest reported usage':'Usage not yet reported'}</Text></p>
 </div>:<DataState unavailable={unavailable} kind={hasEsims?"inactive":undefined}/>}</section>;
}
export default function DashboardOverview({esims,orders,profile=accountProfile(),asOf,esimsUnavailable=false,ordersUnavailable=false}) {
 const {t}=useLanguage();
 const {activeCount,countries,focus}=dashboardSummary(esims,asOf);
 const total=aggregateRemaining(esims,asOf);
 const stats=[[Smartphone,'Active eSIMs',esimsUnavailable?'—':activeCount,'Currently active','/account/esims'],[Globe2,'Countries connected',esimsUnavailable?'—':countries,'total','/account/esims'],[ShoppingBag,'Past orders',ordersUnavailable?'—':orders.length,'in your account','/account/orders'],[ChartPie,'Data remaining',esimsUnavailable?'—':total.kind==='unlimited'?t('Unlimited'):formatDataBytes(total.bytes)||'—',total.kind==='unknown'?'Usage not yet reported':'across available eSIMs','/account/esims']];
 return <><MobileDashboard {...{esims,orders,profile,asOf,esimsUnavailable,ordersUnavailable}}/><div className={`${s.dashboard} ${s.desktopOverview}`} data-dashboard>
  <div className={s.stats}>{stats.map(([Icon,label,value,detail,href])=><Link href={href} className={s.stat} key={label}><span className={s.statIcon}><Icon size={24} strokeWidth={1.7}/></span><div><span className={s.statLabel}><Text>{label}</Text></span><div className={s.statValue}><strong>{value}</strong></div><small><Text>{detail}</Text></small></div><ChevronRight className={s.statArrow} size={17}/></Link>)}</div>
  <div className={s.mainGrid}>
   <section className={`${s.tableCard} ${s.esimsSection}`}><SectionHeading title="My eSIMs" href="/account/esims"/>{esimsUnavailable||!esims.length?<DataState unavailable={esimsUnavailable}/>:<EsimRows esims={esims.slice(0,4)} asOf={asOf}/>}</section>
   <CurrentPlan esim={focus} asOf={asOf} unavailable={esimsUnavailable} hasEsims={esims.length>0}/>
   <section className={`${s.tableCard} ${s.ordersSection}`}><SectionHeading title="Recent orders" href="/account/orders"/>{ordersUnavailable||!orders.length?<DataState unavailable={ordersUnavailable} kind="orders"/>:<OrderList orders={orders.slice(0,5)} compact/>}</section>
   <div className={s.sideCards}>
    <section className={s.smallCard}><div className={s.smallTitle}><UserRound size={19}/><h2><Text>Profile</Text></h2></div><Link className={s.profileHeading} href="/account/profile"><span className={s.avatar}>{profile.initials}</span><div><strong>{profile.name||<Text>My profile</Text>}</strong><small>{profile.email||'—'}</small></div><ChevronRight size={18}/></Link></section>
    <PaymentMethodsCard/>
    <section className={s.smallCard}><div className={s.smallTitle}><Headphones size={19}/><h2><Text>Need Help?</Text></h2></div><Link className={s.smallBody} href="/help#contact"><p><Text>Get support, check guides or contact our team.</Text></p><ChevronRight size={18}/></Link></section>
   </div>
  </div>
 </div></>;
}
