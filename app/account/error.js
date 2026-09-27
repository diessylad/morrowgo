'use client';
import { Text } from './../../components/i18n/Provider';
import en from './../../locales/en.json';

import Link from 'next/link';
import styles from '../../components/account/account.module.css';

export default function AccountError({ reset }) {
  return <section className={styles.empty}><h2><Text>{en["m_94b6d6eeb8fc"]}</Text></h2><p><Text>{en["m_6656ac2d4f54"]}</Text></p><div className={styles.actions}><button className={styles.button} type="button" onClick={() => reset()}><Text>{en["m_042c862e4467"]}</Text></button><Link href="/help#contact" className={styles.textLink}><Text>{en["m_4541e7a202c6"]}</Text></Link></div></section>;
}
