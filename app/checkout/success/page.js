'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { orderPresentation } from '../../../lib/orderPresentation';
import Header from '../../../components/customer/Header';
import { ArrowRight, Copy } from 'lucide-react';
import styles from './success.module.css';

export default function SuccessPage() {
  const [order, setOrder] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [paused, setPaused] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [copied, setCopied] = useState('');
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('session_id') || '';
    setSessionId(id);
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) { setError('This link does not contain a valid order reference. Open the original page returned by checkout.'); setChecking(false); return; }
    let cancelled = false, timer, deadline, attempts = 0;
    const controller = new AbortController();
    setError(''); setPaused(false); setChecking(true);
    async function load() {
      try {
        deadline = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(`/api/orders/status?session_id=${encodeURIComponent(id)}`, { cache: 'no-store', signal: controller.signal });
        const data = await response.json();
        clearTimeout(deadline);
        if (cancelled) return;
        if (!response.ok || !data.ok) throw new Error('status');
        setOrder(data); setChecking(false);
        if (orderPresentation(data).poll) {
          if (++attempts < 20) timer = setTimeout(load, 3000);
          else setPaused(true);
        }
      } catch {
        clearTimeout(deadline);
        if (!cancelled) { setChecking(false); setError('We could not check your order right now. Please try again. This does not mean your payment failed.'); }
      }
    }
    load();
    return () => { cancelled = true; controller.abort(); clearTimeout(timer); clearTimeout(deadline); };
  }, [refresh]);
  const view = orderPresentation(order);
  const total = Number.isFinite(order?.amount) && ['usd','eur'].includes(order?.currency)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency.toUpperCase(), currencyDisplay: 'code' }).format(order.amount / 100)
    : null;
  async function copyReference() {
    try { await navigator.clipboard.writeText(sessionId); setCopied('Order reference copied.'); }
    catch { setCopied('Select the order reference above to copy it manually.'); }
  }
  async function copyInstallation(value, label) {
    try { await navigator.clipboard.writeText(String(value)); setCopied(`${label} copied.`); }
    catch { setCopied('Copy unavailable. Select the value and copy it manually.'); }
  }
  return <div className={styles.page}><Header/><main className={styles.wrap}>

    <section className={styles.hero} aria-live="polite"><span className={styles.eyebrow}>YOUR ORDER</span><h1>{error ? 'Order status unavailable' : view.title}</h1><p>{error || view.text}</p></section>
    {order?.testMode === true && <div className={styles.banner}>Test order — no real Stripe payment. This is a checkout test, not confirmation of a working eSIM.</div>}
    {order && <section className={styles.card}><h2>Order details</h2><dl className={styles.details}><div><dt>Payment</dt><dd className={order.paid ? styles.confirmed : undefined}>{order.paid ? (order.testMode ? 'Test payment confirmed' : 'Confirmed') : 'Pending'}</dd></div><div><dt>eSIM</dt><dd className={view.key === 'ready' ? styles.confirmed : undefined}>{view.key === 'ready' ? 'Issued' : view.key === 'attention' ? 'Needs review' : 'Not ready to install'}</dd></div>{order.iso && <div><dt>Destination</dt><dd>{order.iso}</dd></div>}{total && <div><dt>Total</dt><dd>{total}</dd></div>}</dl></section>}
    {/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId) && <section className={styles.card}><h2>Keep your order reference</h2><p>Save this reference if you need help with your order. Keep your checkout link private.</p><div className={styles.reference}>{sessionId}</div><div className={styles.actions}><button className={`${styles.button} ${styles.secondary}`} onClick={copyReference}>Copy reference</button></div></section>}
    {order?.installation && <section className={styles.card}><h2>Installation details</h2><p>{order.testMode ? 'Sandbox eSIM — these test details cannot install an eSIM.' : 'Keep installation details private.'}</p><dl className={styles.details}>{Object.entries(order.installation).filter(([key,value]) => ['smdpAddress','activationCode','matchingId'].includes(key) && value).map(([key,value]) => <div key={key}><dt>{key === 'smdpAddress' ? 'SM-DP+ address' : 'Activation code'}</dt><dd className={styles.installValue}><code>{value}</code><button type="button" className={styles.copy} aria-label={`Copy ${key === 'smdpAddress' ? 'SM-DP+ address' : 'Activation code'}`} onClick={() => copyInstallation(value, key === 'smdpAddress' ? 'SM-DP+ address' : 'Activation code')}><Copy size={14}/>Copy</button></dd></div>)}</dl></section>}
    {paused && <p className={styles.banner}>Automatic checks have paused. You can check again below; no new payment or order will be created.</p>}
    <p role="status" aria-live="polite" className={styles.muted}>{copied}</p>
    <div className={styles.actions}><Link className={styles.button} href="/">Back to MORROWGO <ArrowRight size={17}/></Link><button className={`${styles.button} ${styles.secondary}`} disabled={checking || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)} onClick={() => setRefresh(v => v + 1)}>{checking ? 'Checking…' : 'Check status again'}</button><Link className={`${styles.button} ${styles.secondary}`} href="/help">Order help</Link></div>
  </main></div>;
}
