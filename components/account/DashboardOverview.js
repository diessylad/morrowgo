import { Text } from './../i18n/Provider';
import en from './../../locales/en.json';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { AccountHeading, DataUnavailable, EmptyEsims, EmptyOrders } from './AccountStates';
import OrderList from './OrderList';
import styles from './account.module.css';

export default function DashboardOverview({ esims, orders, esimCards, esimsUnavailable = false, ordersUnavailable = false }) {
  return <>
    <AccountHeading eyebrow={en["m_a2c9e75e18e5"]} title={en["m_4308f5ef22c9"]}><Text>{en["m_7f46e6fb3346"]}</Text></AccountHeading>
    <div className={styles.stats}>
      <div className={styles.stat}><span><Text>{en["m_7bf740d405dc"]}</Text></span><strong><Text>{esimsUnavailable ? '—' : esims.length}</Text></strong></div>
      <div className={styles.stat}><span><Text>{en["m_17a76e41c2dd"]}</Text></span><strong><Text>{esimsUnavailable ? '—' : esims.filter(esim => esim.status === 'active').length}</Text></strong></div>
      <div className={styles.stat}><span><Text>{en["m_780c32e591cf"]}</Text></span><strong><Text>{ordersUnavailable ? '—' : orders.length}</Text></strong></div>
    </div>
    <section className={styles.section}><div className={styles.sectionHeading}><h2><Text>{en["m_7bf740d405dc"]}</Text></h2><Link href="/account/esims" className={styles.textLink}><Text>{en["m_e4fd3a1794e3"]}</Text><ArrowUpRight size={15} /></Link></div><Text>{esimsUnavailable ? <DataUnavailable label="eSIMs" /> : esims.length ? <div className={styles.grid}><Text>{esimCards}</Text></div> : <EmptyEsims />}</Text></section>
    <section className={styles.section}><div className={styles.sectionHeading}><h2><Text>{en["m_cfc7dec215d0"]}</Text></h2><Link href="/account/orders" className={styles.textLink}><Text>{en["m_e4fd3a1794e3"]}</Text><ArrowUpRight size={15} /></Link></div><Text>{ordersUnavailable ? <DataUnavailable label={en["m_965840381640"]} /> : orders.length ? <OrderList orders={orders.slice(0, 3)} /> : <EmptyOrders />}</Text></section>
  </>;
}
