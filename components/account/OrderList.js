import styles from './account.module.css';

const labels = { paid: 'Paid', pending: 'Pending', processing: 'Processing', awaiting_fulfillment: 'Awaiting eSIM', validated: 'Awaiting eSIM', fulfilling: 'Preparing eSIM', ready: 'Ready', completed: 'Completed', refunded: 'Refunded', cancelled: 'Cancelled', failed: 'Needs attention', validation_failed: 'Needs attention', fulfillment_failed: 'Needs attention', payment_pending: 'Awaiting payment' };

export default function OrderList({ orders, demo = false }) {
  return <div className={styles.orderList}>{orders.map(order => {
    const time = Date.parse(order.orderedAt);
    const date = Number.isFinite(time) ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(time) : 'Date not available';
    let price = null;
    if (Number.isSafeInteger(order.amountTotal) && order.amountTotal >= 0 && /^[A-Z]{3}$/.test(order.currency || '')) {
      try { const digits = new Intl.NumberFormat('en', { style: 'currency', currency: order.currency }).resolvedOptions().maximumFractionDigits; price = new Intl.NumberFormat('en', { style: 'currency', currency: order.currency }).format(order.amountTotal / (10 ** digits)); } catch { /* Unknown currency stays undisplayed. */ }
    }
    return <article className={styles.orderRow} key={order.id}><div className={styles.orderMain}><h3>{order.planName || 'Travel eSIM order'}</h3><p>MORROWGO order {order.id}</p><p>Country: {order.destinationIso || 'Not reported'}</p><p>{date}{demo ? ' · sample order' : ''}</p></div><div className={styles.orderMeta}>{price && <strong>{price}</strong>}<span className={styles.badge}>Payment: {['paid','ready','processing','awaiting_fulfillment'].includes(order.status) ? 'Paid' : order.status === 'refunded' ? 'Refunded' : 'Not confirmed'}</span><span className={styles.badge}>eSIM: {order.status === 'ready' ? 'Issued' : order.status === 'paid' ? 'Awaiting issue' : labels[order.status] || 'Status unavailable'}</span></div></article>;
  })}</div>;
}
