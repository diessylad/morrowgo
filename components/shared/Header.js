'use client';
import { Text, Localized } from './../i18n/Provider';
import en from './../../locales/en.json';
import LanguageSelect from '../i18n/LanguageSelect';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Menu } from 'lucide-react';
import s from '../studio/studio.module.css';
import mobile from './mobile.module.css';
import glass from './liquidHeader.module.css';

export default function Header({ authenticated, home = false, transparent = false, onSearch }) {
  const surface = useRef(null);
  const slot = useRef(null);
  const [floating, setFloating] = useState(false);
  useEffect(() => {
    let frame = 0;
    const update = () => { frame = 0; setFloating(window.scrollY > 32); };
    const scroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', scroll, { passive: true });
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', scroll); };
  }, []);
  const [signedIn, setSignedIn] = useState(authenticated ?? false);
  useEffect(() => {
    if (authenticated !== undefined) { setSignedIn(authenticated); return; }
    let active = true;
    fetch('/api/account/session', {cache:'no-store'}).then(r=>r.json()).then(data=>{if(active)setSignedIn(data.authenticated===true);}).catch(()=>{});
    return () => { active = false; };
  }, [authenticated]);
  const prefix = home ? '' : '/';
  return <div ref={slot} className={glass.slot}><div ref={surface} data-liquid-header data-home={home} data-transparent={transparent} data-floating={floating} className={`${s.root} ${mobile.headerRoot} ${glass.surface}`}>
    <header className={s.header}>
      <Localized as="a" className={s.wordmark} href="/" aria-label={en["m_43350ea9c5ee"]}><span className={s.mark} aria-hidden="true"><i/><i/><i/><i/></span><Text>{en["m_eef9e6b1a9f1"]}</Text></Localized>
      <Localized as="nav" aria-label={en["m_efd197f3fce4"]}><a href={`${prefix}#destinations`}><Text>{en["m_0fc66bc4363c"]}</Text></a><a href={`${prefix}#how`}><Text>{en["m_1dd6a17cb403"]}</Text></a><a href={`${prefix}#product`}><Text>{en["m_04535aee2489"]}</Text></a></Localized>
      <a className={s.accountLink} href={signedIn ? '/account' : '/login'}><Text>{signedIn ? en["m_619098172f46"] : en["m_ada2e9e96fa9"]}</Text></a><button className={s.navCta} onClick={onSearch || (()=>{window.location.href='/#destinations';})}><Text>{en["m_f469df981f57"]}</Text><ArrowRight size={19}/></button>
      <LanguageSelect/><details className={mobile.menu}><Localized as="summary" aria-label={en["m_0f53b30706b1"]}><Menu size={23}/></Localized><div><a href="/destinations"><Text>{en["m_0fc66bc4363c"]}</Text></a><a href="/#how"><Text>{en["m_1dd6a17cb403"]}</Text></a><a href="/#product"><Text>{en["m_04535aee2489"]}</Text></a><a href="/compatibility"><Text>{en["m_b23ea372f302"]}</Text></a><a href="/help"><Text>{en["m_cb01db0194f1"]}</Text></a><a href={signedIn ? '/account' : '/login'}><Text>{signedIn ? en["m_619098172f46"] : en["m_ada2e9e96fa9"]}</Text></a></div></details>
    </header>
  </div></div>;
}
