'use client';
import { Text } from './../i18n/Provider';
import en from './../../locales/en.json';
import LanguageSelect from '../i18n/LanguageSelect';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowRight,UserRound} from 'lucide-react';
import s from './customer.module.css';
export default function Header({authenticated=false}) {
 const [signedIn,setSignedIn]=useState(authenticated);
 useEffect(()=>{let active=true;fetch('/api/account/session',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(active)setSignedIn(d.authenticated===true);}).catch(()=>{if(active)setSignedIn(false);});return()=>{active=false;};},[]);
 return <header className={s.header}><Link href="/" className={s.brand}><span className={s.mark} aria-hidden="true"><i/><i/><i/><i/></span><Text>{en["m_eef9e6b1a9f1"]}</Text></Link><nav><Link href="/destinations"><Text>{en["m_0fc66bc4363c"]}</Text></Link><Link href="/#how"><Text>{en["m_1dd6a17cb403"]}</Text></Link><Link href="/help"><Text>{en["m_f32d5a3b17e6"]}</Text></Link></nav><div className={s.headerActions}><LanguageSelect/><Link href={signedIn?'/account':'/login'} className={s.profile}><UserRound size={16}/><span><Text>{signedIn?en["m_619098172f46"]:en["m_ada2e9e96fa9"]}</Text></span></Link><Link href="/destinations" className={s.button}><Text>{en["m_f469df981f57"]}</Text><ArrowRight size={17}/></Link></div></header>;
}
