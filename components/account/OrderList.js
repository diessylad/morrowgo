'use client';
import { Text, useLanguage } from './../i18n/Provider';
import en from './../../locales/en.json';
import styles from './account.module.css';

const labels = { paid: en["m_dc9d4584a554"], pending: en["m_96f608c16cef"], processing: en["m_e63451d3cf90"], awaiting_fulfillment: en["m_944ea5e9b0a7"], validated: en["m_944ea5e9b0a7"], fulfilling: en["m_ed87f9a4a1f0"], ready: en["m_20c7c5522fc2"], completed: en["m_1798b3ba42ee"], refunded: en["m_d6fbc7a82d1c"], cancelled: en["m_a1bf92eff40d"], failed: en["m_a126722ec044"], validation_failed: en["m_a126722ec044"], fulfillment_failed: en["m_a126722ec044"], payment_pending: en["m_9a08b57abd6c"] };

export default function OrderList({ orders, demo = false }) {
  const { language } = useLanguage();
  return <div className={styles.orderList}>{orders.map(order => {
    const time = Date.parse(order.orderedAt);
    const date = Number.isFinite(time) ? new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : language, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(time) : en["m_57497eccf823"];
    let price = null;
    if (Number.isSafeInteger(order.amountTotal) && order.amountTotal >= 0 && /^[A-Z]{3}$/.test(order.currency || '')) {
      try { const digits = new Intl.NumberFormat(language, { style: 'currency', currency: order.currency }).resolvedOptions().maximumFractionDigits; price = new Intl.NumberFormat(language, { style: 'currency', currency: order.currency }).format(order.amountTotal / (10 ** digits)); } catch { /* Unknown currency stays undisplayed. */ }
    }
    return <article className={styles.orderRow} key={order.id}><div className={styles.orderMain}><h3>{order.planName || en["m_03aff979c8ca"]}</h3><p><Text>{en["m_8a8652bc72e1"]}</Text>{order.id}</p><p><Text>{en["m_9932d589dd9d"]}</Text><Text>{order.destinationIso || en["m_98e856820171"]}</Text></p><p><Text>{date}{demo ? ' · sample order' : ''}</Text></p></div><div className={styles.orderMeta}><Text>{price && <strong><Text>{price}</Text></strong>}</Text><span className={styles.badge}><Text>{en["m_ac774cf300f4"]}</Text><Text>{['paid','ready','processing','awaiting_fulfillment'].includes(order.status) ? en["m_dc9d4584a554"] : order.status === 'refunded' ? en["m_d6fbc7a82d1c"] : en["m_b9e09ae263fb"]}</Text></span><span className={styles.badge}><Text>{en["m_0165b320a35b"]}</Text><Text>{order.status === 'ready' ? en["m_deb5d5e2f038"] : order.status === 'paid' ? en["m_ae1c809d9945"] : labels[order.status] || en["m_f261ff7629df"]}</Text></span></div></article>;
  })}</div>;
}
