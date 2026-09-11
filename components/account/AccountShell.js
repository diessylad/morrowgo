import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import LogoutButton from '../auth/LogoutButton';
import AccountNavigation from './AccountNavigation';
import styles from './account.module.css';

export default function AccountShell({ children, demo = false }) {
  return <div className={styles.page}>
    <header className={styles.header}>
      <Link href="/" className={styles.brand}>MORROWGO</Link>
      <div className={styles.headerActions}><Link className={styles.exploreLink} href="/destinations">Explore destinations <ArrowUpRight size={14} /></Link>{demo ? <Link href="/login" className={styles.textLink}>Sign in</Link> : <LogoutButton />}</div>
    </header>
    <div className={styles.layout}>
      <aside className={styles.sidebar}><p className={styles.sidebarLabel}>MY MORROWGO</p><AccountNavigation demo={demo} /><p className={styles.sidebarNote}>Your connections.<br />Ready for what’s next.</p></aside>
      <main className={styles.content}>
        {demo ? <div className={styles.demoBanner}><strong>DEMO ACCOUNT · SAMPLE DATA</strong>This is a design preview. No customer account, payment or working eSIM. Usage, networks and dates below are examples.</div> : <div className={styles.prelaunch}>MORROWGO is preparing for launch. Real eSIM delivery is currently disabled.</div>}
        {children}
        <footer className={styles.footer}>MORROWGO / GO FURTHER.</footer>
      </main>
    </div>
  </div>;
}
