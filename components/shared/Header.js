'use client';

import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import s from '../studio/studio.module.css';

export default function Header({ authenticated, home = false, onSearch }) {
  const [signedIn, setSignedIn] = useState(authenticated ?? false);
  useEffect(() => {
    if (authenticated !== undefined) { setSignedIn(authenticated); return; }
    let active = true;
    fetch('/api/account/session', {cache:'no-store'}).then(r=>r.json()).then(data=>{if(active)setSignedIn(data.authenticated===true);}).catch(()=>{});
    return () => { active = false; };
  }, [authenticated]);
  const prefix = home ? '' : '/';
  return <div className={s.root} style={{position:'relative',zIndex:10}}>
    <header className={s.header}>
      <a className={s.wordmark} href="/" aria-label="MORROWGO home"><span className={s.mark} aria-hidden="true"><i/><i/><i/><i/></span>MORROWGO</a>
      <nav aria-label="Main navigation"><a href={`${prefix}#destinations`}>Destinations</a><a href={`${prefix}#how`}>How it works</a><a href={`${prefix}#product`}>The experience</a></nav>
      <a className={s.accountLink} href={signedIn ? '/account' : '/login'}>{signedIn ? 'My account' : 'Sign in'}</a><button className={s.navCta} onClick={onSearch || (()=>{window.location.href='/#destinations';})}>Find your eSIM <ArrowRight size={19}/></button>
    </header>
  </div>;
}
