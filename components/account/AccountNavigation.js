'use client';
import { Text, Localized } from './../i18n/Provider';
import en from './../../locales/en.json';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Smartphone, ReceiptText, UserRound, CircleHelp } from 'lucide-react';
import styles from './account.module.css';

export default function AccountNavigation({ demo = false }) {
  const pathname = usePathname();
  const links = [
    [demo ? '/demo/account' : '/account', en["m_0efc2e6be4c2"], LayoutDashboard],
    [demo ? '/demo/account#esims' : '/account/esims', en["m_7bf740d405dc"], Smartphone],
    [demo ? '/demo/account#orders' : '/account/orders', en["m_cded093321dd"], ReceiptText],
    [demo ? '/register' : '/account/settings', en["m_c7f73bb54d92"], UserRound],
    ['/help', en["m_f32d5a3b17e6"], CircleHelp]
  ];
  return <Localized as="nav" className={styles.menu} aria-label={en["m_07acbbb7c7b4"]}><Text>{links.map(([href, label, Icon]) => <Link key={href} href={href} className={pathname === href ? styles.active : undefined} aria-current={pathname === href ? 'page' : undefined}><Icon size={18} strokeWidth={1.5} /><Text>{label}</Text></Link>)}</Text></Localized>;
}
