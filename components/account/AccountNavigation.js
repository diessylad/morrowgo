'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Smartphone, ReceiptText, UserRound, CircleHelp } from 'lucide-react';
import styles from './account.module.css';

export default function AccountNavigation({ demo = false }) {
  const pathname = usePathname();
  const links = [
    [demo ? '/demo/account' : '/account', 'Overview', LayoutDashboard],
    [demo ? '/demo/account#esims' : '/account/esims', 'My eSIMs', Smartphone],
    [demo ? '/demo/account#orders' : '/account/orders', 'My orders', ReceiptText],
    [demo ? '/register' : '/account/settings', 'Account', UserRound],
    ['/help', 'Support', CircleHelp]
  ];
  return <nav className={styles.menu} aria-label="My MORROWGO navigation">{links.map(([href, label, Icon]) => <Link key={href} href={href} className={pathname === href ? styles.active : undefined} aria-current={pathname === href ? 'page' : undefined}><Icon size={18} strokeWidth={1.5} />{label}</Link>)}</nav>;
}
