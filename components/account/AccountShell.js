import { Text } from './../i18n/Provider';
import en from './../../locales/en.json';
import { CookieSettingsLink } from '../privacy/CookieConsent';
import Link from 'next/link';
import Header from '../customer/Header';
import { ArrowUpRight } from 'lucide-react';
import LogoutButton from '../auth/LogoutButton';
import AccountNavigation from './AccountNavigation';
import styles from './account.module.css';

export default function AccountShell({ children, demo = false }) {
  return <div className={styles.page}>
    <Header authenticated={!demo}/>
    <Text>{!demo && <div className={styles.logout}><LogoutButton/></div>}</Text>
    <div className={styles.layout}>
      <aside className={styles.sidebar}><p className={styles.sidebarLabel}><Text>{en["m_371b0c0d62e4"]}</Text></p><AccountNavigation demo={demo} /><p className={styles.sidebarNote}><Text>{en["m_d7b48a1a9bb8"]}</Text><br /><Text>{en["m_45cba5c61e8d"]}</Text></p></aside>
      <main className={styles.content}>
        <Text>{demo ? <div className={styles.demoBanner}><strong><Text>{en["m_af9f7af1d5c4"]}</Text></strong><Text>{en["m_6edff944672d"]}</Text></div> : <div className={styles.prelaunch}><Text>{en["m_368e46b562e7"]}</Text></div>}</Text>
        <Text>{children}</Text>
        <footer className={styles.footer}><Text>{en["m_303107e2dd8f"]}</Text><CookieSettingsLink/></footer>
      </main>
    </div>
  </div>;
}
