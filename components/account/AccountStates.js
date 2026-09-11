import Link from 'next/link';
import { ArrowUpRight, CloudOff, Smartphone, ReceiptText } from 'lucide-react';
import styles from './account.module.css';

export function AccountHeading({ eyebrow = 'MY MORROWGO', title, children }) {
  return <div className={styles.heading}><div><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1>{children && <p className={styles.intro}>{children}</p>}</div></div>;
}

export function DataUnavailable({ label = 'account information' }) {
  return <section className={styles.empty} role="status"><CloudOff size={34} strokeWidth={1.3} /><h2>Your {label} is unavailable.</h2><p>We couldn’t load this information. Please try again later or contact support. No purchase or activation has been started.</p><Link href="/help#contact" className={styles.textLink}>Contact support <ArrowUpRight size={15} /></Link></section>;
}

export function EmptyEsims() {
  return <section className={styles.empty}><Smartphone size={36} strokeWidth={1.2} /><h3>Your next connection starts here.</h3><p>No eSIMs are linked to your account yet. After an eSIM is issued and linked to you, its installation details will appear here. Usage will appear when it is available from the network.</p><div className={styles.actions}><Link className={styles.button} href="/destinations">Explore destinations <ArrowUpRight size={15} /></Link><Link className={styles.textLink} href="/compatibility">Check your phone</Link></div></section>;
}

export function EmptyOrders() {
  return <section className={styles.empty}><ReceiptText size={34} strokeWidth={1.3} /><h3>No orders linked yet.</h3><p>Your account orders will appear here. If you checked out as a guest, keep your confirmation; guest orders are not linked to an account automatically.</p><Link href="/help#contact" className={styles.textLink}>Get help with an order <ArrowUpRight size={15} /></Link></section>;
}
