 'use client';
import Link from '../shared/ReturnAwareLink';
import {Text,Message,useLanguage} from '../i18n/Provider';
import {ChevronRight} from 'lucide-react';
import {countryName,countryFlag,daysRemaining,esimStatus} from '../../lib/account/presentation.mjs';
import {getUsageSummary} from '../../lib/esims/usage';
import s from './mobileEsim.module.css';
const labels={active:'Active',ready:'Ready to install',expired:'Expired',depleted:'Used',pending:'Pending',processing:'Processing',suspended:'Suspended',cancelled:'Cancelled',failed:'Failed'};
export default function MobileEsimRow({esim,asOf,inline=false}){
 const {language}=useLanguage(),usage=getUsageSummary(esim),days=daysRemaining(esim,asOf),status=esimStatus(esim,asOf);
 return <div className={s.row} data-status={status}>
 <div className={s.heading}><strong><span aria-hidden="true">{countryFlag(esim.destinationIso)}</span>{countryName(esim,language)}</strong><span className={s.status}><Text>{labels[status]||'Status unavailable'}</Text></span></div>
 <p className={s.plan}>{usage.initialLabel||esim.planName||'—'}{esim.validityDays!=null&&<> · <Message message="{days} days" values={{days:esim.validityDays}}/></>}</p>
 {status!=='ready'&&<><p className={s.balance}>{usage.isUnlimited?<Text>Unlimited</Text>:usage.remainingLabel?<><Text>{usage.remainingLabel}</Text> <Text>remaining</Text></>:<Text>Usage not yet reported</Text>}</p>{usage.remainingPercent!=null&&<div className={s.progress}><span style={{width:`${usage.remainingPercent}%`}}/></div>}</>}
 <div className={s.bottom}>{status==='ready'?<Link href={`/account/esims?install=${encodeURIComponent(esim.id)}#esim-${esim.id}`}><Text>View installation details</Text><ChevronRight size={18}/></Link>:<><span>{days!=null?<Message message="{days} days left" values={{days}}/>:<Text>Expiry not reported</Text>}</span>{!inline&&<Link href={`/account/esims#esim-${esim.id}`} aria-label={countryName(esim,language)}><ChevronRight size={18}/></Link>}</>}</div>
 </div>;
}
