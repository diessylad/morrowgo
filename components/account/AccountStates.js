import { Text, Message } from './../i18n/Provider';
import en from './../../locales/en.json';
import Link from '../shared/ReturnAwareLink';
import { ArrowUpRight, CloudOff, Smartphone, ReceiptText } from 'lucide-react';
import styles from './account.module.css';

export function AccountHeading({ eyebrow = en["m_371b0c0d62e4"], title, children }) {
  return <div className={styles.heading}><div><p className={styles.eyebrow}><Text>{eyebrow}</Text></p><h1><Text>{title}</Text></h1><Text>{children && <p className={styles.intro}><Text>{children}</Text></p>}</Text></div></div>;
}

export function DataUnavailable({ label = en["m_640568e3cf42"] }) {
  return <section className={styles.empty} role="status"><CloudOff size={34} strokeWidth={1.3} /><h2><Message message={en["account.unavailable"]} values={{label}} localize={["label"]}/></h2><p><Text>{en["m_bf3db9f125de"]}</Text></p><Link href="/help#contact" className={styles.textLink}><Text>{en["m_6e68b5b82386"]}</Text><ArrowUpRight size={15} /></Link></section>;
}

export function EmptyEsims() {
  return <section className={styles.empty}><Smartphone size={36} strokeWidth={1.2} /><h3><Text>{en["m_ab30b9a14eae"]}</Text></h3><p><Text>{en["m_1dca701efc5b"]}</Text></p><div className={styles.actions}><Link className={styles.button} href="/destinations"><Text>{en["m_628851f6f56a"]}</Text><ArrowUpRight size={15} /></Link><Link className={styles.textLink} href="/compatibility"><Text>{en["m_a2ef95bd7bb1"]}</Text></Link></div></section>;
}

export function EmptyOrders() {
  return <section className={styles.empty}><ReceiptText size={34} strokeWidth={1.3} /><h3><Text>{en["m_9f906408c960"]}</Text></h3><p><Text>{en["m_9b8e76ad00f4"]}</Text></p><Link href="/help#contact" className={styles.textLink}><Text>{en["m_984a59e9b026"]}</Text><ArrowUpRight size={15} /></Link></section>;
}
