'use client';
import { Text, Localized, useLanguage } from './../i18n/Provider';
import en from './../../locales/en.json';

import { useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, Smartphone, FileText, X } from 'lucide-react';
import s from './purchaseBar.module.css';

export default function PurchaseBar({ plan, country, formatData, onBuy, embedded = false, detailsHref, actionLabel, compact = false }) {
  const { language } = useLanguage();
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
    catch { setError(en["m_be017b4b61ff"]); setPending(false); }
  }
  const amount = new Intl.NumberFormat(language === 'en' ? 'en-IE' : language, { style: 'currency', currency: /^[A-Z]{3}$/.test(plan.currency || '') ? plan.currency : 'EUR' }).format(Number(plan.price));
  const speed = plan.speed || plan.networkTypes?.join(' / ');
  return <>
    <Text>{!embedded && <div ref={spacer} className={s.spacer} aria-hidden="true" />}</Text>
    <Localized as="section" ref={bar} className={`${s.bar} ${embedded ? s.embedded : ''} ${compact ? s.compact : ''}`} aria-label={en["m_565c6db33d4f"]}>
      <div className={s.inner}>
        <div className={s.controls}>
          <div className={s.tools}>
            <button type="button" onClick={() => setPanel('details')}><FileText size={17}/><Text>{en["m_4fbca6f3b88e"]}</Text></button>
            {!compact && <button type="button" onClick={() => setPanel('device')}><Smartphone size={17}/><Text>{en["m_92cb69d7dd14"]}</Text></button>}
          <Text>{detailsHref && <a href={detailsHref}><Text>{en["m_5b5459086c1f"]}</Text></a>}</Text>
          </div>
          <label className={s.confirm}><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)}/><span><Text>{en["m_8d8ba3101eef"]}</Text></span></label>
        </div>
        <div className={s.checkout}>
          <div className={s.total} aria-live="polite"><span><Text>{country}</Text> · <Text>{formatData(plan)}</Text> · <Text>{`${plan.duration} days`}</Text></span><div><Text>{en["m_00dda8b7e768"]}</Text><strong><Text>{amount}</Text></strong></div></div>
          <button type="button" className={s.buy} disabled={!confirmed || pending} onClick={purchase}><Text>{pending ? en["m_5afeca73bef6"] : actionLabel || en["m_c38860a3ba58"]}</Text><ArrowRight size={19}/></button>
        </div>
      </div>
      <p className={s.testNotice}><Text>{en["m_23746f639088"]}</Text></p>
      <Text>{error && <p className={s.error} role="alert"><Text>{error}</Text></p>}</Text>
    </Localized>
    {panel && <dialog ref={dialog} className={s.dialog} aria-labelledby={headingId} onKeyDown={e => e.stopPropagation()} onCancel={e => { e.preventDefault(); e.stopPropagation(); setPanel(null); }} onClick={e => { if (e.target === e.currentTarget) setPanel(null); }}>
      <div className={s.dialogBody}>
        <header><h2 id={headingId}><Text>{panel === 'device' ? en["m_32f97fc59b0c"] : en["m_02200d7081ea"]}</Text></h2><Localized as="button" type="button" aria-label={en["m_bbfa773e5a63"]} onClick={() => setPanel(null)} autoFocus><X size={21}/></Localized></header>
        {panel === 'device' ? <>
          <p><Text>{en["m_66fe58273278"]}</Text></p>
          <h3><Text>{en["m_97f2142cbb71"]}</Text></h3><ol><li><Text>{en["m_05ec35675c1e"]}</Text></li><li><Text>{en["m_ba029e764069"]}</Text></li><li><Text>{en["m_d8aafbb625ec"]}</Text></li></ol>
          <h3><Text>{en["m_1928f95c598b"]}</Text></h3><ol><li><Text>{en["m_668886076dc8"]}</Text></li><li><Text>{en["m_d2d54f743de9"]}</Text></li><li><Text>{en["m_6959d26b1816"]}</Text></li></ol>
          <a href="/compatibility" target="_blank" rel="noreferrer"><Text>{en["m_cfb0279d6e65"]}</Text></a>
          <button type="button" className={s.done} onClick={() => setPanel(null)}><Text>{en["m_68e01f2260e9"]}</Text></button>
        </> : <>
          <p><Text>{country}</Text> · <Text>{formatData(plan)}</Text> · <Text>{`${plan.duration} days`}</Text></p>
          <dl><dt><Text>{en["m_3e8248e32edf"]}</Text></dt><dd><Text>{amount}</Text></dd>
          {plan.operator && <><dt><Text>{en["m_d0e687b079fb"]}</Text></dt><dd>{plan.operator}</dd></>}
          {plan.networks?.length > 0 && <><dt><Text>{en["m_e931cb5b030b"]}</Text></dt><dd>{plan.networks.join(' / ')}</dd></>}
          <Text>{speed && <><dt><Text>{en["m_3f9f4ecac321"]}</Text></dt><dd><Text>{speed}</Text></dd></>}</Text>
          <Text>{plan.fairUsage && <><dt><Text>{en["m_a2ed706aaefc"]}</Text></dt><dd><Text>{plan.fairUsage}</Text></dd></>}</Text>
          <Text>{plan.packageType && <><dt><Text>{en["m_aee0d8dd793f"]}</Text></dt><dd><Text>{plan.packageType === 'data' ? en["m_c646cf24f147"] : en["m_562e6da06518"]}</Text></dd></>}</Text>
          </dl><button type="button" className={s.done} onClick={() => setPanel(null)}><Text>{en["m_68e01f2260e9"]}</Text></button>
        </>}
      </div>
    </dialog>}
  </>;
}
