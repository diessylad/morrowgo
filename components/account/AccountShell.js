import Link from 'next/link';
import Header from '../customer/Header';
import { ArrowUpRight } from 'lucide-react';
import LogoutButton from '../auth/LogoutButton';
import AccountNavigation from './AccountNavigation';
import styles from './account.module.css';

export default function AccountShell({ children, demo = false }) {
  return <div className={styles.page}>
    <Header authenticated={!demo}/>
    {!demo && <div className={styles.logout}><LogoutButton/></div>}
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
