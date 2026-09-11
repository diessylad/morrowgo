import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { requireAccount } from '../../../lib/auth/session';
import { AccountHeading } from '../../../components/account/AccountStates';
import styles from '../../../components/account/account.module.css';

export const metadata = { title: 'Account settings · MORROWGO' };

export default async function AccountSettingsPage() {
  const { user } = await requireAccount('/account/settings');
  return <>
    <AccountHeading title="Your account.">A private space for your travel connections.</AccountHeading>
    <div className={styles.settingsGrid}>
      <section className={styles.panel}><p className={styles.eyebrow}>YOUR EMAIL</p><h2>Account details</h2><p className={styles.accountDetail}>{user.email}</p><span className={styles.badge}>Email verified</span><p>Use this email to sign in to My MORROWGO.</p></section>
      <section className={styles.panel}><p className={styles.eyebrow}>SIGN-IN SECURITY</p><h2>Password</h2><p>Request a secure reset link to change your password. We will never ask you to send your password by email.</p><Link href="/forgot-password" className={`${styles.button} ${styles.secondary}`}>Reset password <ArrowUpRight size={15} /></Link></section>
    </div>
    <section className={styles.section}><div className={styles.panel}><h2>Help with your account</h2><p>For account access or order questions, contact MORROWGO support. Keep payment details and eSIM installation codes private.</p><Link href="/help#contact" className={styles.textLink}>Contact support <ArrowUpRight size={15} /></Link></div></section>
  </>;
}
