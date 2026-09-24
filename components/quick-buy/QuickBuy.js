'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import s from './quickBuy.module.css';
import PlanCard from '../destination/PlanCard';
import PlanCategory from '../destination/PlanCategory';
import { selectPlans } from './selectPlans.mjs';

function allowance(plan) {
  if (plan.unlimited) return 'Unlimited';
  if (plan.dataMB && Number(plan.dataMB) < 1024) return `${plan.dataMB} MB`;
  if (plan.dataGB) return `${Number(Number(plan.dataGB).toFixed(2))} GB`;
  return plan.dataMB ? `${plan.dataMB} MB` : 'Data plan';
}
function price(plan) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: plan.currency || 'EUR' }).format(Number(plan.price));
}

// Mount with a country { code, name, flag }; unmount onClose. No catalogue or
// payment state is duplicated: checkout revalidates the chosen package ID.
export default function QuickBuy({ country, onClose }) {
  const router = useRouter();
  const dialog = useRef(null);
  const titleId = useId();
  const [packages, setPlans] = useState([]);
  const [category, setCategory] = useState('fixed');
  const plans = selectPlans(packages, category);
  const [status, setStatus] = useState('loading');
  const [attempt, setAttempt] = useState(0);
  const iso = String(country.code || country.iso || '').toUpperCase();
  const name = country.name || iso;
  const flag = country.flag || (/^[A-Z]{2}$/.test(iso) ? String.fromCodePoint(...[...iso].map(c => c.charCodeAt(0) + 127397)) : '');

  useEffect(() => {
    const node = dialog.current;
    const trigger = document.activeElement;
    const body = document.body;
    const html = document.documentElement;
    const previous = { body: body.style.overflow, html: html.style.overflow, padding: body.style.paddingRight };
    const scrollbar = innerWidth - html.clientWidth;
    if (scrollbar) body.style.paddingRight = `${parseFloat(getComputedStyle(body).paddingRight) + scrollbar}px`;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    node.showModal();
    return () => {
      node.close();
      body.style.overflow = previous.body;
      html.style.overflow = previous.html;
      body.style.paddingRight = previous.padding;
      if (trigger instanceof HTMLElement && trigger.isConnected) trigger.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;
    const timeout = setTimeout(() => controller.abort(), 25000);
    setStatus('loading');
    setPlans([]);
    fetch(`/api/catalogue?country=${encodeURIComponent(iso)}`, { signal: controller.signal })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !data.ok || !Array.isArray(data.packages)) throw new Error('Catalogue unavailable');
        return data.packages;
      })
      .then(packages => {
        if (!active) return;
        setPlans(packages);
        setStatus('ready');
      })
      .catch(() => { if (active) setStatus('error'); })
      .finally(() => clearTimeout(timeout));
    return () => { active = false; clearTimeout(timeout); controller.abort(); };
  }, [iso, attempt]);

  function buy(plan) {
    onClose();
    router.push(`/checkout?iso=${encodeURIComponent(iso)}&plan=${encodeURIComponent(plan.id)}`);
  }
  return <dialog ref={dialog} className={s.dialog} aria-labelledby={titleId}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), summary')];
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={s.panel}>
      <header className={s.heading}>
        <span className={s.flag} aria-hidden="true">{flag}</span>
        <div><p>{name}</p><h2 id={titleId}>eSIM plans for {name}</h2></div>
        <button className={s.close} onClick={onClose} aria-label="Close Quick Buy" autoFocus><X size={21}/></button>
      </header>
      <div className={s.content} aria-busy={status === 'loading'}>
        {status === 'loading' && <p className={s.message} role="status">Loading available plans…</p>}
        {status === 'error' && <div className={s.message}><p role="alert">Could not load eSIM plans. Please try again.</p><button className={s.retry} onClick={() => setAttempt(value => value + 1)}>Try again</button></div>}
        {status === 'ready' && <PlanCategory value={category} onChange={setCategory}/>}
        {status === 'ready' && !plans.length && <p className={s.message} role="status">No {category === 'unlimited' ? 'unlimited' : 'fixed-data'} plans are currently available for this destination.</p>}
        {status === 'ready' && plans.length > 0 && <div className={s.cardList}>
          {plans.map(plan => <PlanCard key={plan.id} plan={plan}
            recommended={!plan.unlimited && (Number(plan.dataGB) === 5 || Number(plan.dataMB) === 5120)}
            formatData={allowance} onBuy={buy} showSpeedDetails/>)}
          <details className={s.networkDetails}><summary>Network &amp; plan details</summary>
            {plans.map(plan => <div key={plan.id}><strong>{allowance(plan)} · {plan.duration} days · {price(plan)}</strong>
              {plan.operator && <p>{plan.operator}</p>}
              {plan.networks?.length > 0 && <p>Networks: {plan.networks.join(' / ')}</p>}
              {(plan.speed || plan.networkTypes?.length > 0) && <p>{plan.speed || plan.networkTypes.join(' / ')}</p>}
              {plan.fairUsage && <p>{plan.fairUsage}</p>}
            </div>)}
          </details>
        </div>}
      </div>
      <footer className={s.actions}>
        <a className={s.details} href={`/destination/${encodeURIComponent(iso)}`}>View details</a>
      </footer>
    </div>
  </dialog>;
}
