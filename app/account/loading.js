import styles from '../../components/account/account.module.css';

export default function LoadingAccount() {
  return <div role="status" aria-live="polite"><p className={styles.intro}>Loading your account…</p><div className={styles.skeleton} aria-hidden="true" /></div>;
}
