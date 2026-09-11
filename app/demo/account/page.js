import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import AccountShell from '../../../components/account/AccountShell';
import EsimCard from '../../../components/account/EsimCard';
import OrderList from '../../../components/account/OrderList';
import { AccountHeading } from '../../../components/account/AccountStates';
import { getUsageSummary } from '../../../lib/esims/usage';
import styles from '../../../components/account/account.module.css';

// Illustrative fixtures stay in this public, explicitly labelled demo route.
// Protected account pages load owned records and never fall back to these values.
const sampleEsim = {
  id: 'demo-esim', destinationIso: 'DE', planName: '10 GB / 30 days',
  initialDataBytes: 10_000_000_000, remainingDataBytes: 6_400_000_000, usedDataBytes: 3_600_000_000,
  validityDays: 30, activatedAt: '2026-08-31T12:00:00Z', expiresAt: '2026-09-30T12:00:00Z',
  status: 'active', networks: ['Telekom', 'Vodafone'], supports5G: true,
  rechargeable: true, orderedAt: '2026-08-31T10:00:00Z', usageUpdatedAt: '2026-09-12T12:00:00Z',
  installDetails: { smdpAddress: 'demo.morrowgo.invalid', activationCode: 'DEMO-NOT-AN-ACTIVATION-CODE' }
};
const sampleOrders = [{ id: 'demo-order', orderedAt: sampleEsim.orderedAt, planName: 'Germany · 10 GB / 30 days', status: 'ready' }];

export default function DemoAccountPage() {
  return <AccountShell demo>
    <AccountHeading eyebrow="YOUR TRIP. CONNECTED." title="A world within reach.">An example of your future travel dashboard. One place for your eSIMs, usage and orders.</AccountHeading>
    <div className={styles.stats}><div className={styles.stat}><span>Example eSIMs</span><strong>1</strong></div><div className={styles.stat}><span>Example active</span><strong>1</strong></div><div className={styles.stat}><span>Example orders</span><strong>1</strong></div></div>
    <section className={styles.section} id="esims"><div className={styles.sectionHeading}><h2>My eSIMs</h2><span className={styles.muted}>Demonstration</span></div><div className={styles.grid}><EsimCard esim={sampleEsim} usage={getUsageSummary(sampleEsim)} demo asOf="2026-09-12T12:00:00Z" /><aside className={styles.panel}><p className={styles.eyebrow}>READY FOR YOUR NEXT TRIP</p><h2>Less to manage.<br />More to explore.</h2><p>Your eSIM information and installation details will stay together in My MORROWGO.</p><p>Real usage will come from the selected supplier. This preview is an example, not a live network reading.</p><div className={styles.actions}><Link href="/demo/order" className={`${styles.button} ${styles.secondary}`}>Preview installation <ArrowUpRight size={15} /></Link></div></aside></div></section>
    <section className={styles.section} id="orders"><div className={styles.sectionHeading}><h2>My orders</h2><span className={styles.muted}>Sample · no payment</span></div><OrderList orders={sampleOrders} demo /></section>
    <div className={styles.actions}><Link href="/register" className={styles.button}>Create your account <ArrowUpRight size={15} /></Link><Link href="/help" className={styles.textLink}>Visit our help centre</Link></div>
  </AccountShell>;
}
