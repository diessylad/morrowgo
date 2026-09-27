import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Text, Message } from '../i18n/Provider';
import { CookieSettingsLink } from '../privacy/CookieConsent';
import LogoutButton from '../auth/LogoutButton';
import AccountNavigation from './AccountNavigation';
import AccountControls from './AccountControls';
import { accountProfile } from '../../lib/account/presentation.mjs';
import brand from '../customer/customer.module.css';
import styles from './account.module.css';
import s from './dashboard.module.css';
export default function AccountShell({ children, demo = false, profile = accountProfile() }) {
  return <div className={styles.page}><div className={styles.layout}>
    <aside className={styles.sidebar}><Link href="/" className={`${brand.brand} ${s.brand}`} aria-label="MORROWGO"><span className={brand.mark} aria-hidden="true"><i/><i/><i/><i/></span>MORROWGO</Link><AccountNavigation demo={demo}/>
      <Link href="/destinations" className={s.promo}><span><Text>Explore the world connected.</Text></span><span className={s.promoArrow}><ArrowRight size={16}/></span><small><Text>Global eSIM for modern travelers</Text></small></Link>
    </aside>
    <main className={styles.content} id="account-content"><div className={s.topbar}><div className={s.greeting}><h1>{profile.firstName ? <Message message="Hi, {name}!" values={{name:profile.firstName}}/> : <Text>Welcome back.</Text>}</h1><p><Text>Manage your eSIMs, check your usage, and stay connected worldwide.</Text></p></div><AccountControls profile={profile}>{!demo && <LogoutButton/>}</AccountControls></div>
      {demo && <p className={s.previewNote}>Local preview · sample data only</p>}{children}
      <footer className={s.footer}>{!demo && <span><Text>MORROWGO is preparing for launch. Real eSIM delivery is currently disabled.</Text></span>}<CookieSettingsLink/></footer>
    </main></div></div>;
}
