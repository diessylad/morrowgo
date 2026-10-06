 'use client';
import Link from '../shared/ReturnAwareLink';
import {ChevronRight} from 'lucide-react';
import {Text,Message,useLanguage} from '../i18n/Provider';
import {dashboardSummary,countryFlag,countryName,daysRemaining,esimStatus} from '../../lib/account/presentation.mjs';
import {getUsageSummary} from '../../lib/esims/usage';
import {StatusPill} from './DashboardOverview';
import s from './mobileDashboard.module.css';
export default function MobileDashboard({esims,orders,profile,asOf,esimsUnavailable,ordersUnavailable}){
 const {language,t}=useLanguage(),{focus}=dashboardSummary(esims,asOf);
 const usage=getUsageSummary(focus),ready=focus?.status==='ready',days=focus?daysRemaining(focus,asOf):null;
 const other=esims.filter(e=>e.id!==focus?.id).slice(0,2);
 const href=e=>`/account/esims${e.status==='ready'?`?install=${encodeURIComponent(e.id)}`:''}#esim-${e.id}`;
 return <div className={s.mobile}>
 <div className={s.intro}><div><h1><Text>Your connections</Text></h1><p>{profile.firstName?<Message message="Welcome back, {name}." values={{name:profile.firstName}}/>:<Text>Welcome back.</Text>}</p></div><Link className={s.avatar} href="/account/profile" aria-label={t('My profile')}>{profile.initials}</Link></div>
 <section className={s.plan} aria-label={t('Your eSIM')}><img className={s.art} src="/images/current-plan-esim-cluster.png" alt="" aria-hidden="true"/>
 {focus?<><div className={s.country}><span aria-hidden="true">{countryFlag(focus.destinationIso)}</span><div><h2>{countryName(focus,language)}</h2><p>{usage.initialLabel||focus.planName||'—'}{focus.validityDays!=null&&<> · <Message message="{days} days" values={{days:focus.validityDays}}/></>}</p></div></div>
 <div className={s.status}><StatusPill esim={focus} asOf={asOf}/></div>
 {ready?<><p className={s.prompt}><Text>Your eSIM is ready.</Text></p><p className={s.hint}><Text>{focus.sandbox?'View your test eSIM and installation details.':'Install it before your trip. Follow your plan’s activation instructions.'}</Text></p></>:<><p className={s.balance}>{usage.isUnlimited?<Text>Unlimited</Text>:usage.remainingLabel||<Text>Usage not yet reported</Text>}</p>{usage.remainingPercent!=null&&<div className={s.progress} role="progressbar" aria-label={t('Data remaining')} aria-valuenow={Math.round(usage.remainingPercent)} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${usage.remainingPercent}%`}}/></div>}<div className={s.remaining}><span>{usage.initialLabel&&<Message message="of {data} remaining" values={{data:usage.initialLabel}}/>}</span><span>{days!=null?<Message message="{days} days left" values={{days}}/>:<Text>Expiry not reported</Text>}</span></div></>}
 <Link className={s.primary} href={href(focus)}><Text>{ready?(focus.sandbox?'View installation details':'Install eSIM'):'Manage eSIM'}</Text><ChevronRight size={18}/></Link>
 <details className={s.details}><summary><Text>Plan details</Text></summary><dl><div><dt><Text>Operator</Text></dt><dd>{focus.networks?.join(' / ')||t('Not reported')}</dd></div>{focus.supports5G===true&&<div><dt><Text>Network</Text></dt><dd>5G</dd></div>}<div><dt><Text>Status</Text></dt><dd><StatusPill esim={focus} asOf={asOf}/></dd></div></dl>{!ready&&<p><Text>{focus.usageUpdatedAt?'Latest reported usage':'Usage not yet reported'}</Text></p>}</details></>:<><h2><Text>{esimsUnavailable?'Your data is temporarily unavailable.':esims.length?'No active eSIM':'No eSIMs yet.'}</Text></h2><p className={s.hint}><Text>{esimsUnavailable?'Please try again later or contact support.':esims.length?'View your eSIMs for installation and status details.':'Your next connection starts here.'}</Text></p><Link className={s.primary} href={esimsUnavailable?'/help#contact':esims.length?'/account/esims':'/destinations'}><Text>{esimsUnavailable?'Contact support':esims.length?'My eSIMs':'Find your eSIM'}</Text><ChevronRight size={18}/></Link></>}
 </section>
 {other.length>0&&<section className={s.others}><div className={s.heading}><h2><Text>Other eSIMs</Text></h2><Link href="/account/esims"><Text>View all</Text><ChevronRight size={14}/></Link></div>{other.map(e=>{const u=getUsageSummary(e),d=daysRemaining(e,asOf),state=esimStatus(e,asOf);return <Link key={e.id} href={href(e)} className={s.row}><span className={s.flag} aria-hidden="true">{countryFlag(e.destinationIso)}</span><div className={s.rowText}><strong>{countryName(e,language)}</strong><p>{state==='ready'?(u.initialLabel||e.planName):u.isUnlimited?t('Unlimited'):u.remainingLabel||t('Usage not yet reported')}{state==='ready'&&e.validityDays!=null&&<> · <Message message="{days} days" values={{days:e.validityDays}}/></>}{state==='active'&&d!=null&&<> · <Message message="{days} days left" values={{days:d}}/></>}</p></div><StatusPill esim={e} asOf={asOf}/><ChevronRight size={16}/></Link>})}</section>}
 <Link className={s.buy} href="/destinations"><Text>Find your next eSIM</Text><ChevronRight size={18}/></Link>
 <div className={s.utility}><Link href="/account/orders"><span><Text>Orders</Text></span><span className={s.utilityRight}><small>{ordersUnavailable?<Text>Temporarily unavailable</Text>:<Message message="{count} orders" values={{count:orders.length}}/>}</small><ChevronRight size={17}/></span></Link><Link href="/help#contact"><Text>Need help connecting?</Text><ChevronRight size={17}/></Link></div>
 </div>;
}
