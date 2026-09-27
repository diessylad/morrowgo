import { Text } from './../../../components/i18n/Provider';
import en from './../../../locales/en.json';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { requireAccount } from '../../../lib/auth/session';
import { AccountHeading } from '../../../components/account/AccountStates';
import styles from '../../../components/account/account.module.css';

export const metadata = { title: 'Account settings · MORROWGO' };

export default async function AccountSettingsPage() {
  const { user } = await requireAccount('/account/settings');
  return <>
    <AccountHeading title={en["m_0cbe8269c2ef"]}><Text>{en["m_2e943a50213e"]}</Text></AccountHeading>
    <div className={styles.settingsGrid}>
      <section className={styles.panel}><p className={styles.eyebrow}><Text>{en["m_0a79060dd81a"]}</Text></p><h2><Text>{en["m_e68d6d1e1cf2"]}</Text></h2><p className={styles.accountDetail}>{user.email}</p><span className={styles.badge}><Text>{en["m_82f47c3d4dd2"]}</Text></span><p><Text>{en["m_cd0e2d9dbdaf"]}</Text></p></section>
      <section className={styles.panel}><p className={styles.eyebrow}><Text>{en["m_22f9dc8ce6d9"]}</Text></p><h2><Text>{en["m_8be3c943b160"]}</Text></h2><p><Text>{en["m_f2fe5ca47601"]}</Text></p><Link href="/forgot-password" className={`${styles.button} ${styles.secondary}`}><Text>{en["m_ddaa25f52ab5"]}</Text><ArrowUpRight size={15} /></Link></section>
    </div>
    <section className={styles.section}><div className={styles.panel}><h2><Text>{en["m_082d24277e40"]}</Text></h2><p><Text>{en["m_a55d43059e9d"]}</Text></p><Link href="/help#contact" className={styles.textLink}><Text>{en["m_6e68b5b82386"]}</Text><ArrowUpRight size={15} /></Link></div></section>
  </>;
}
