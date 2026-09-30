'use client';
import { Text, Localized } from './../../../components/i18n/Provider';
import en from './../../../locales/en.json';
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
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) { setError(en["m_32c848c5011f"]); setChecking(false); return; }
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
        if (!cancelled) { setChecking(false); setError(en["m_2ea9260730a1"]); }
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
    try { await navigator.clipboard.writeText(sessionId); setCopied(en["m_0c6fb9b35a45"]); }
    catch { setCopied(en["m_991939987584"]); }
  }
  async function copyInstallation(value, label) {
    try { await navigator.clipboard.writeText(String(value)); setCopied(`${label} copied.`); }
    catch { setCopied(en["m_7263bcf330df"]); }
  }
  return <div className={styles.page}><Header/><main className={styles.wrap}>

    <section className={styles.hero} aria-live="polite"><span className={styles.eyebrow}><Text>{en["m_16c0b19aa100"]}</Text></span><h1><Text>{error ? en["m_58ed3ddfa7a1"] : view.title}</Text></h1><p><Text>{error || view.text}</Text></p></section>
    <Text>{order?.testMode === true && <div className={styles.banner}><Text>{en["m_08e6200b6d51"]}</Text></div>}</Text>
    <Text>{order && <section className={styles.card}><h2><Text>{en["m_1a897948db8b"]}</Text></h2><dl className={styles.details}><div><dt><Text>{en["m_b41a92bed032"]}</Text></dt><dd className={order.paid ? styles.confirmed : undefined}><Text>{order.paid ? (order.testMode ? en["m_83641af7ebc9"] : 'Confirmed') : en["m_96f608c16cef"]}</Text></dd></div><div><dt><Text>{en["m_dd68a406ba2c"]}</Text></dt><dd className={view.key === 'ready' ? styles.confirmed : undefined}><Text>{view.key === 'ready' ? en["m_deb5d5e2f038"] : view.key === 'attention' ? en["m_33a506cf6ec5"] : en["m_473e6e7ec058"]}</Text></dd></div><Text>{order.iso && <div><dt><Text>{en["m_d42713493ca8"]}</Text></dt><dd><Text>{order.iso}</Text></dd></div>}{total && <div><dt><Text>{en["m_b25928c69902"]}</Text></dt><dd><Text>{total}</Text></dd></div>}</Text></dl></section>}</Text>
    <Text>{/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId) && <section className={styles.card}><h2><Text>{en["m_8408ef1072be"]}</Text></h2><p><Text>{en["m_65da87d1528a"]}</Text></p><div className={styles.reference}><Text>{sessionId}</Text></div><div className={styles.actions}><button className={`${styles.button} ${styles.secondary}`} onClick={copyReference}><Text>{en["m_955753b196f5"]}</Text></button></div></section>}</Text>
    <Text>{order?.installation && <section className={styles.card}><h2><Text>{en["m_cf24a2dc5a2e"]}</Text></h2><p><Text>{order.testMode ? en["m_ca5e4e15972b"] : en["m_f5682790f22f"]}</Text></p><dl className={styles.details}><Text>{Object.entries(order.installation).filter(([key,value]) => ['smdpAddress','activationCode','matchingId'].includes(key) && value).map(([key,value]) => <div key={key}><dt><Text>{key === 'smdpAddress' ? en["m_0485074ecc16"] : en["m_e0a372431167"]}</Text></dt><dd className={styles.installValue}><code>{value}</code><Localized as="button" type="button" className={styles.copy} aria-label={`Copy ${key === 'smdpAddress' ? en["m_0485074ecc16"] : en["m_e0a372431167"]}`} onClick={() => copyInstallation(value, key === 'smdpAddress' ? en["m_0485074ecc16"] : en["m_e0a372431167"])}><Copy size={14}/><Text>{en["m_af74f7c5362a"]}</Text></Localized></dd></div>)}</Text></dl></section>}</Text>
    <Text>{paused && <p className={styles.banner}><Text>{en["m_88403d0edd65"]}</Text></p>}</Text>
    <p role="status" aria-live="polite" className={styles.muted}><Text>{copied}</Text></p>
    <div className={styles.actions}>{order?.paid && <Link className={styles.button} href={order.accountOrderId && view.key === 'ready' ? `/account/esims?install=${order.accountOrderId}#esim-${order.accountOrderId}` : '/account/esims'}>View my eSIM<ArrowRight size={17}/></Link>}<Link className={styles.button} href="/"><Text>{en["m_82ee1ec23c23"]}</Text><ArrowRight size={17}/></Link><button className={`${styles.button} ${styles.secondary}`} disabled={checking || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)} onClick={() => setRefresh(v => v + 1)}><Text>{checking ? en["m_820d6004b037"] : en["m_b4ec4de83ba9"]}</Text></button><Link className={`${styles.button} ${styles.secondary}`} href="/help"><Text>{en["m_681fdf85851c"]}</Text></Link></div>
  </main></div>;
}
