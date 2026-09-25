'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, Smartphone, FileText, X } from 'lucide-react';
import s from './purchaseBar.module.css';

export default function PurchaseBar({ plan, country, formatData, onBuy, embedded = false, detailsHref }) {
  const [confirmed, setConfirmed] = useState(false);
  const [panel, setPanel] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const bar = useRef(null);
  const spacer = useRef(null);
  const dialog = useRef(null);
  const headingId = useId();
  useEffect(() => {
    const update = () => {
      if (bar.current && spacer.current) spacer.current.style.height = `${bar.current.getBoundingClientRect().height + 28}px`;
    };
    update();
    const observer = new ResizeObserver(update);
    if (bar.current) observer.observe(bar.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => { setConfirmed(false); setPending(false); }, [country]);
  useEffect(() => {
    if (!panel) return;
    const node = dialog.current;
    const trigger = document.activeElement;
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    node.showModal();
    return () => {
      node.close();
      document.documentElement.style.overflow = previous;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [panel]);
  async function purchase() {
    if (!confirmed || pending) return;
    setPending(true);
    setError('');
    try { await onBuy(plan); }
    catch { setError('Could not open payment. Please try again.'); setPending(false); }
  }
  const amount = new Intl.NumberFormat('en-IE', { style: 'currency', currency: /^[A-Z]{3}$/.test(plan.currency || '') ? plan.currency : 'EUR' }).format(Number(plan.price));
  const speed = plan.speed || plan.networkTypes?.join(' / ');
  return <>
    {!embedded && <div ref={spacer} className={s.spacer} aria-hidden="true" />}
    <section ref={bar} className={`${s.bar} ${embedded ? s.embedded : ''}`} aria-label="Your selected eSIM plan">
      <div className={s.inner}>
        <div className={s.controls}>
          <div className={s.tools}>
            <button type="button" onClick={() => setPanel('details')}><FileText size={17}/>Package details</button>
            <button type="button" onClick={() => setPanel('device')}><Smartphone size={17}/>Check device</button>
          {detailsHref && <a href={detailsHref}>View details ↗</a>}
          </div>
          <label className={s.confirm}><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/><span>I confirm my device supports eSIM and is network-unlocked.</span></label>
        </div>
        <div className={s.checkout}>
          <div className={s.total} aria-live="polite"><span>{country} · {formatData(plan)} · {plan.duration} days</span><div>Total <strong>{amount}</strong></div></div>
          <button type="button" className={s.buy} disabled={!confirmed || pending} onClick={purchase}>{pending ? 'Please wait…' : 'Buy now'}<ArrowRight size={19}/></button>
        </div>
      </div>
      <p className={s.testNotice}>Test checkout · Test eSIMs cannot be installed.</p>
      {error && <p className={s.error} role="alert">{error}</p>}
    </section>
    {panel && <dialog ref={dialog} className={s.dialog} aria-labelledby={headingId} onKeyDown={e => e.stopPropagation()} onCancel={e => { e.preventDefault(); e.stopPropagation(); setPanel(null); }} onClick={e => { if (e.target === e.currentTarget) setPanel(null); }}>
      <div className={s.dialogBody}>
        <header><h2 id={headingId}>{panel === 'device' ? 'Is your phone ready?' : 'Your eSIM package'}</h2><button type="button" aria-label="Close" onClick={() => setPanel(null)} autoFocus><X size={21}/></button></header>
        {panel === 'device' ? <>
          <p>Check your exact model, country of purchase and carrier. This is a manual checklist, not an automatic device test.</p>
          <h3>iPhone</h3><ol><li>Confirm eSIM support for your exact model and region with Apple.</li><li>Open Settings → General → About. Carrier Lock should say “No SIM restrictions”.</li><li>Look for Add eSIM under Cellular / Mobile Service.</li></ol>
          <h3>Android</h3><ol><li>Check your exact model and regional version with the manufacturer.</li><li>Look for Add eSIM under Network &amp; internet / Connections → SIMs / SIM manager.</li><li>Ask your carrier to confirm your phone is unlocked.</li></ol>
          <a href="/compatibility" target="_blank" rel="noreferrer">Full compatibility guide ↗</a>
          <button type="button" className={s.done} onClick={() => setPanel(null)}>Back to my plan</button>
        </> : <>
          <p>{country} · {formatData(plan)} · {plan.duration} days</p>
          <dl><dt>Price</dt><dd>{amount}</dd>
          {plan.operator && <><dt>Operator</dt><dd>{plan.operator}</dd></>}
          {plan.networks?.length > 0 && <><dt>Networks</dt><dd>{plan.networks.join(' / ')}</dd></>}
          {speed && <><dt>Network type / speed</dt><dd>{speed}</dd></>}
          {plan.fairUsage && <><dt>Fair use</dt><dd>{plan.fairUsage}</dd></>}
          {plan.packageType && <><dt>Plan type</dt><dd>{plan.packageType === 'data' ? 'Data only' : 'Data + calls + texts'}</dd></>}
          </dl><button type="button" className={s.done} onClick={() => setPanel(null)}>Back to my plan</button>
        </>}
      </div>
    </dialog>}
  </>;
}
