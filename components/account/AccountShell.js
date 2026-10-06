import Link from '../shared/ReturnAwareLink';
import { Text, Message } from '../i18n/Provider';
import { CookieSettingsLink } from '../privacy/CookieConsent';
import LogoutButton from '../auth/LogoutButton';
import AccountSidebar from './AccountSidebar';
import AccountControls from './AccountControls';
import ShaderR from './ShaderR';
import { accountProfile } from '../../lib/account/presentation.mjs';
import styles from './account.module.css';
import s from './dashboard.module.css';
export default function AccountShell({ children, demo = false, profile = accountProfile(), purchase = false }) {
  return <div className={styles.page}><ShaderR/><div className={styles.layout}>
    <AccountSidebar demo={demo}/>
    <main className={styles.content} id="account-content"><div className={s.topbar}><div className={s.greeting}><h1>{purchase ? <Text>Your purchase</Text> : profile.firstName ? <Message message="Hi, {name}!" values={{name:profile.firstName}}/> : <Text>Welcome back.</Text>}</h1><p><Text>{purchase ? "Your next connection, all in one place." : "Manage your eSIMs, check your usage, and stay connected worldwide."}</Text></p></div><AccountControls profile={profile}>{!demo && <LogoutButton/>}</AccountControls></div>
      {demo && <p className={s.previewNote}>Local preview · sample data only</p>}{children}
      <footer className={s.footer}>{!demo && <span><Text>Preview mode · Real eSIM delivery is currently disabled.</Text></span>}<CookieSettingsLink/></footer>
    </main></div></div>;
}
