import { Text } from './../../components/i18n/Provider';
import en from './../../locales/en.json';
import styles from '../../components/account/account.module.css';

export default function LoadingAccount() {
  return <div role="status" aria-live="polite"><p className={styles.intro}><Text>{en["m_447bf4634493"]}</Text></p><div className={styles.skeleton} aria-hidden="true" /></div>;
}
