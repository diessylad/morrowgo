'use client';
import { Text, Localized, Message, useLanguage } from './../i18n/Provider';
import en from './../../locales/en.json';

import { useEffect, useId, useRef, useState } from 'react';
import PurchaseBar from '../purchase/PurchaseBar';
import { startCheckout } from '../purchase/startCheckout';
import { X } from 'lucide-react';
import s from './quickBuy.module.css';
import PlanCard from '../destination/PlanCard';
import PlanCategory from '../destination/PlanCategory';
import { selectPlans } from './selectPlans.mjs';

function allowance(plan) {
  if (plan.unlimited) return en["m_b8bef37b7153"];
  if (plan.dataMB && Number(plan.dataMB) < 1024) return `${plan.dataMB} MB`;
  if (plan.dataGB) return `${Number(Number(plan.dataGB).toFixed(2))} GB`;
  return plan.dataMB ? `${plan.dataMB} MB` : en["m_fa28de1bbbe3"];
}
function price(plan) {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: plan.currency || 'EUR' }).format(Number(plan.price));
}

// Mount with a country { code, name, flag }; unmount onClose. No catalogue or
// payment state is duplicated: checkout revalidates the chosen package ID.
export default function QuickBuy({ country, onClose }) {
  const { t } = useLanguage();
  const [selectedId, setSelectedId] = useState(null);
  const dialog = useRef(null);
  const titleId = useId();
  const [packages, setPlans] = useState([]);
  const [category, setCategory] = useState('fixed');
  const plans = selectPlans(packages, category);
  const selectedPlan = plans.find(plan => plan.id === selectedId) || plans[0];
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

  function buy(plan) { return startCheckout(iso, plan); }
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
        <span className={s.flag} aria-hidden="true"><Text>{flag}</Text></span>
        <div><p><Text>{name}</Text></p><h2 id={titleId}><Message message={en["plans.countryTitle"]} values={{country:t(name)}}/></h2></div>
        <Localized as="button" className={s.close} onClick={onClose} aria-label={en["m_6ec585226cb2"]} autoFocus><X size={21}/></Localized>
      </header>
      <div className={s.content} aria-busy={status === 'loading'}>
        <Text>{status === 'loading' && <p className={s.message} role="status"><Text>{en["m_d138fa8f7ff9"]}</Text></p>}</Text>
        <Text>{status === 'error' && <div className={s.message}><p role="alert"><Text>{en["m_cef7c74413fc"]}</Text></p><button className={s.retry} onClick={() => setAttempt(value => value + 1)}><Text>{en["m_042c862e4467"]}</Text></button></div>}</Text>
        <Text>{status === 'ready' && <PlanCategory value={category} onChange={setCategory}/>}</Text>
        <Text>{status === 'ready' && !plans.length && <p className={s.message} role="status"><Text>{en["m_85cdebe11045"]}</Text><Text>{category === en["m_e1a6f0b6f73a"] ? en["m_e1a6f0b6f73a"] : en["m_45300a3b9412"]}</Text><Text>{en["m_00d769d8f7d5"]}</Text></p>}</Text>
        {status === 'ready' && plans.length > 0 && <div className={s.cardList}>
          {plans.map(plan => <PlanCard key={plan.id} plan={plan}
            recommended={!plan.unlimited && (Number(plan.dataGB) === 5 || Number(plan.dataMB) === 5120)}
            formatData={allowance} onBuy={buy} onSelect={plan => setSelectedId(plan.id)} selected={plan.id === selectedPlan?.id} showSpeedDetails/>)}

        </div>}
      </div>
      <Text>{status === 'ready' && selectedPlan ? <PurchaseBar embedded key={iso} plan={selectedPlan} country={name} formatData={allowance} onBuy={buy} detailsHref={`/destination/${encodeURIComponent(iso)}`}/> : <footer className={s.actions}><a className={s.details} href={`/destination/${encodeURIComponent(iso)}`}><Text>{en["m_badd385121c5"]}</Text></a></footer>}</Text>

    </div>
  </dialog>;
}
