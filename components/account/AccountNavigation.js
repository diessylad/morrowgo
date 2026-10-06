'use client';
import Link from '../shared/ReturnAwareLink';
import { usePathname } from 'next/navigation';
import MobileMenu from '../shared/MobileMenu';
import LogoutButton from '../auth/LogoutButton';
import { LayoutDashboard, Smartphone, ReceiptText, Globe2, Headphones, CreditCard, Settings } from 'lucide-react';
import { Text, Localized } from '../i18n/Provider';
import styles from './account.module.css';
import s from './dashboard.module.css';
export default function AccountNavigation({ demo = false }) {
  const actualPath = usePathname();
  const pathname = demo ? "/account" : actualPath;
  const isActive = href => href === '/account'
    ? pathname === '/account' || pathname === '/dashboard'
    : pathname === href || pathname.startsWith(`${href}/`) || (href === '/account/settings' && pathname.startsWith('/account/profile'));
  const links = [['/account','Dashboard',LayoutDashboard],['/account/esims','My eSIMs',Smartphone],['/account/orders','Orders',ReceiptText],['/destinations','Destinations',Globe2],['/account/payment-methods','Wallet',CreditCard],['/help','Support',Headphones],['/account/settings','Settings',Settings]];
  const navigation = <Localized as="nav" className={styles.menu} aria-label="Account navigation">{links.map(([href,label,Icon]) => <Link key={href} href={href} className={isActive(href) ? styles.active : undefined} aria-current={isActive(href) ? 'page' : undefined}><Icon size={18} strokeWidth={1.5}/><Text>{label}</Text></Link>)}</Localized>;
  return <><div className={s.desktopNav}>{navigation}</div><MobileMenu account links={links.map(([href,label,Icon])=>({href,label,Icon,active:isActive(href)}))} secondary={[{href:'/account/profile',label:'My account'},{href:'/account/orders',label:'Notifications'}]}>{!demo&&<LogoutButton/>}</MobileMenu></>;
}
