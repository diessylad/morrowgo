'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {ArrowRight,UserRound} from 'lucide-react';
import s from './customer.module.css';
export default function Header({authenticated=false}) {
 const [signedIn,setSignedIn]=useState(authenticated);
 useEffect(()=>{let active=true;fetch('/api/account/session',{cache:'no-store'}).then(r=>r.json()).then(d=>{if(active)setSignedIn(d.authenticated===true);}).catch(()=>{if(active)setSignedIn(false);});return()=>{active=false;};},[]);
 return <header className={s.header}><Link href="/" className={s.brand}><span className={s.mark} aria-hidden="true"><i/><i/><i/><i/></span>MORROWGO</Link><nav><Link href="/destinations">Destinations</Link><Link href="/#how">How it works</Link><Link href="/help">Support</Link></nav><div className={s.headerActions}><Link href={signedIn?'/account':'/login'} className={s.profile}><UserRound size={16}/><span>{signedIn?'My account':'Sign in'}</span></Link><Link href="/destinations" className={s.button}>Find your eSIM <ArrowRight size={17}/></Link></div></header>;
}
