'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Menu } from 'lucide-react';
import s from '../studio/studio.module.css';
import mobile from './mobile.module.css';

export default function Header({ authenticated, home = false, onSearch }) {
  const [signedIn, setSignedIn] = useState(authenticated ?? false);
  useEffect(() => {
    if (authenticated !== undefined) { setSignedIn(authenticated); return; }
    let active = true;
    fetch('/api/account/session', {cache:'no-store'}).then(r=>r.json()).then(data=>{if(active)setSignedIn(data.authenticated===true);}).catch(()=>{});
    return () => { active = false; };
  }, [authenticated]);
  const prefix = home ? '' : '/';
  return <div data-motion-header className={`${s.root} ${mobile.headerRoot}`} style={{position:'relative',zIndex:10}}>
    <header className={s.header}>
      <a className={s.wordmark} href="/" aria-label="MORROWGO home"><span className={s.mark} aria-hidden="true"><i/><i/><i/><i/></span>MORROWGO</a>
      <nav aria-label="Main navigation"><a href={`${prefix}#destinations`}>Destinations</a><a href={`${prefix}#how`}>How it works</a><a href={`${prefix}#product`}>The experience</a></nav>
      <a className={s.accountLink} href={signedIn ? '/account' : '/login'}>{signedIn ? 'My account' : 'Sign in'}</a><button className={s.navCta} onClick={onSearch || (()=>{window.location.href='/#destinations';})}>Find your eSIM <ArrowRight size={19}/></button>
      <details className={mobile.menu}><summary aria-label="Open navigation"><Menu size={23}/></summary><div><a href="/destinations">Destinations</a><a href="/#how">How it works</a><a href="/#product">The experience</a><a href="/compatibility">Device compatibility</a><a href="/help">Help & FAQ</a><a href={signedIn ? '/account' : '/login'}>{signedIn ? 'My account' : 'Sign in'}</a></div></details>
    </header>
  </div>;
}
