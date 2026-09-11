'use client';

import Link from 'next/link';
import styles from '../../components/account/account.module.css';

export default function AccountError({ reset }) {
  return <section className={styles.empty}><h2>Your account couldn’t be loaded.</h2><p>Please try again. If this keeps happening, contact support for help.</p><div className={styles.actions}><button className={styles.button} type="button" onClick={() => reset()}>Try again</button><Link href="/help#contact" className={styles.textLink}>Get support</Link></div></section>;
}
