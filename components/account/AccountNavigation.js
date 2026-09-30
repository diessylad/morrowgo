'use client';
import Link from '../shared/ReturnAwareLink';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { LayoutDashboard, Smartphone, ReceiptText, Globe2, Headphones, CreditCard, Settings, Menu } from 'lucide-react';
import { Text, Localized } from '../i18n/Provider';
import styles from './account.module.css';
import s from './dashboard.module.css';
export default function AccountNavigation({ demo = false }) {
  const actualPath = usePathname(), mobile = useRef(null);
  const pathname = demo ? "/account" : actualPath;
  useEffect(() => { if (mobile.current) mobile.current.open = false; }, [pathname]);
  const links = [['/account','Dashboard',LayoutDashboard],['/account/esims','My eSIMs',Smartphone],['/account/orders','Orders',ReceiptText],['/destinations','Destinations',Globe2],['/account/payment-methods','Wallet',CreditCard],['/help','Support',Headphones],['/account/settings','Settings',Settings]];
  const navigation = <Localized as="nav" className={styles.menu} aria-label="Account navigation">{links.map(([href,label,Icon]) => <Link key={href} href={href} className={pathname === href ? styles.active : undefined} aria-current={pathname === href ? 'page' : undefined}><Icon size={18} strokeWidth={1.5}/><Text>{label}</Text></Link>)}</Localized>;
  return <><div className={s.desktopNav}>{navigation}</div><details className={s.mobileNav} ref={mobile}><summary><Menu size={18}/><Text>Menu</Text></summary>{navigation}</details></>;
}
