import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { AccountHeading, DataUnavailable, EmptyEsims, EmptyOrders } from './AccountStates';
import OrderList from './OrderList';
import styles from './account.module.css';

export default function DashboardOverview({ esims, orders, esimCards, esimsUnavailable = false, ordersUnavailable = false }) {
  return <>
    <AccountHeading eyebrow="YOUR TRIP. CONNECTED." title="Your world, connected.">Your eSIMs, orders and travel connections, together in one place.</AccountHeading>
    <div className={styles.stats}>
      <div className={styles.stat}><span>My eSIMs</span><strong>{esimsUnavailable ? '—' : esims.length}</strong></div>
      <div className={styles.stat}><span>Active eSIMs</span><strong>{esimsUnavailable ? '—' : esims.filter(esim => esim.status === 'active').length}</strong></div>
      <div className={styles.stat}><span>My orders</span><strong>{ordersUnavailable ? '—' : orders.length}</strong></div>
    </div>
    <section className={styles.section}><div className={styles.sectionHeading}><h2>My eSIMs</h2><Link href="/account/esims" className={styles.textLink}>View all <ArrowUpRight size={15} /></Link></div>{esimsUnavailable ? <DataUnavailable label="eSIMs" /> : esims.length ? <div className={styles.grid}>{esimCards}</div> : <EmptyEsims />}</section>
    <section className={styles.section}><div className={styles.sectionHeading}><h2>Recent orders</h2><Link href="/account/orders" className={styles.textLink}>View all <ArrowUpRight size={15} /></Link></div>{ordersUnavailable ? <DataUnavailable label="orders" /> : orders.length ? <OrderList orders={orders.slice(0, 3)} /> : <EmptyOrders />}</section>
  </>;
}
