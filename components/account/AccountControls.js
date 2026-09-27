'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Search, Globe2, Bell, ChevronDown, ArrowUpRight } from 'lucide-react';
import { Text, Localized, useLanguage } from '../i18n/Provider';
import LanguageSelect from '../i18n/LanguageSelect';
import s from './dashboard.module.css';
export default function AccountControls({ profile, children }) {
  const root = useRef(null), path = usePathname();
  const [query,setQuery] = useState('');
  const [searchOpen,setSearchOpen] = useState(false);
  const { t } = useLanguage();
  useEffect(() => { root.current?.querySelectorAll('details[open]').forEach(el => el.open = false); setSearchOpen(false); setQuery(''); }, [path]);
  useEffect(() => {
    const close = e => {
      if (e.key === 'Escape' || (e.type === 'pointerdown' && root.current && !root.current.contains(e.target))) {
        root.current?.querySelectorAll('details[open]').forEach(el => { if (e.key === 'Escape') el.querySelector('summary')?.focus(); el.open = false; });
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown',close);document.addEventListener('pointerdown',close);
    return () => { document.removeEventListener('keydown',close);document.removeEventListener('pointerdown',close); };
  }, []);
  return <div className={s.controls} ref={root} onClick={e=>{if(e.target.closest("a")){setSearchOpen(false);root.current?.querySelectorAll("details[open]").forEach(el=>el.open=false);}}}>
    <div className={s.searchWrap}><form action="/destinations" className={s.search} role="search"><button type="submit" aria-label={t('Search')}><Search size={20}/></button><Localized as="input" name="q" value={query} onChange={e=>{setQuery(e.target.value);setSearchOpen(true);}} onFocus={()=>setSearchOpen(true)} placeholder="Search destinations, orders, or help…" aria-label="Search destinations, orders, or help…" maxLength={100} autoComplete="off"/></form>
      {searchOpen && <div className={`${s.dropdown} ${s.searchResults}`}><Link href={`/destinations?q=${encodeURIComponent(query.trim())}`}><Text>Destinations</Text><ArrowUpRight size={14}/></Link><Link href={`/account/orders?q=${encodeURIComponent(query.trim())}`}><Text>Orders</Text><ArrowUpRight size={14}/></Link><Link href="/help"><Text>Help & FAQ</Text><ArrowUpRight size={14}/></Link></div>}
    </div>
    <div className={s.language}><Globe2 size={19}/><LanguageSelect/></div>
    <details className={s.notifications}><summary aria-label={t('Notifications')}><Bell size={20}/></summary><div className={s.dropdown}><strong><Text>Notifications</Text></strong><p><Text>Updates are available in your orders and eSIM details.</Text></p><Link href="/account/orders"><Text>View orders</Text><ArrowUpRight size={14}/></Link></div></details>
    <details className={s.profileMenu}><summary><span className={s.avatar}>{profile.initials}</span><ChevronDown size={15}/><span className={s.srOnly}><Text>My account</Text></span></summary><div className={s.dropdown}><strong>{profile.name || <Text>My account</Text>}</strong><Link href="/account/profile"><Text>Edit profile</Text></Link><Link href="/account/settings"><Text>Settings</Text></Link>{children}</div></details>
  </div>;
}
