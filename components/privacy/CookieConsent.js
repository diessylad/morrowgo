'use client';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useLanguage } from '../i18n/Provider';
import { CONSENT_KEY, readConsent, makeConsent } from '../../lib/i18n/consent.mjs';
import s from './cookies.module.css';
const Context = createContext({ analytics: false, marketing: false });
export const useConsent = () => useContext(Context);
// Optional integrations must be mounted inside this gate, never at module scope.
export function ConsentGate({ category, children }) { const consent = useConsent(); return consent[category] === true ? children : null; }
export function CookieSettingsLink() {
  const { t } = useLanguage();
  return <button type="button" className={s.link} onClick={() => window.dispatchEvent(new Event('morrowgo-cookie-settings'))}>{t('Cookie settings')}</button>;
}
export default function CookieConsent({ children }) {
  const { t } = useLanguage();
  const pathname = usePathname();
  const hasFooter = pathname === '/' || /^\/(account|login|register|forgot-password|reset-password)(\/|$)/.test(pathname || '');
  const [consent, setConsent] = useState(null);
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const dialog = useRef(null);
  useEffect(() => {
    try { setConsent(readConsent(localStorage.getItem(CONSENT_KEY))); } catch {}
    setReady(true);
    const show = () => setOpen(true);
    const sync = event => { if (event.key === CONSENT_KEY) setConsent(readConsent(event.newValue)); };
    window.addEventListener('morrowgo-cookie-settings', show);
    window.addEventListener('storage', sync);
    return () => { window.removeEventListener('morrowgo-cookie-settings', show); window.removeEventListener('storage', sync); };
  }, []);
  useEffect(() => {
    if (!open) return;
    setAnalytics(consent?.analytics || false); setMarketing(consent?.marketing || false);
    const node = dialog.current, trigger = document.activeElement, previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden'; node.showModal();
    return () => { node.close(); document.documentElement.style.overflow = previous; if (trigger?.isConnected) trigger.focus?.(); };
  }, [open]);
  function save(a, m) {
    const next = makeConsent(a, m); setConsent(next); setOpen(false);
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(next)); } catch {}
    window.dispatchEvent(new CustomEvent('morrowgo-consent-change', { detail: next }));
  }
  return <Context.Provider value={{ analytics: consent?.analytics === true, marketing: consent?.marketing === true }}>{children}{!hasFooter && <footer className={s.pageFooter}><CookieSettingsLink/></footer>}{ready && createPortal(<>
    {!consent && !open && <section className={s.banner} aria-label={t('Cookie preferences')}><h2>{t('Your privacy, your choice.')}</h2><p>{t('We use necessary storage for sign-in and your preferences. Optional analytics and marketing stay off unless you allow them.')}</p><div className={s.actions}><button onClick={() => save(true, true)}>{t('Accept all')}</button><button onClick={() => save(false, false)}>{t('Reject non-essential')}</button><button onClick={() => setOpen(true)}>{t('Preferences')}</button></div></section>}
    {open && <dialog ref={dialog} className={s.dialog} aria-labelledby="cookie-title" onCancel={e => { e.preventDefault(); setOpen(false); }}><header><h2 id="cookie-title">{t('Cookie preferences')}</h2><button aria-label={t('Close')} onClick={() => setOpen(false)}>×</button></header><p>{t('You can change your choices at any time in Cookie settings. No optional tracking is currently installed.')}</p><label><span><strong>{t('Necessary')}</strong><small>{t('Required for authentication, security, language and consent preferences. Always enabled.')}</small></span><input type="checkbox" checked disabled/></label><label><span><strong>{t('Analytics')}</strong><small>{t('Helps understand how the website is used. Disabled until you consent.')}</small></span><input type="checkbox" checked={analytics} onChange={e => setAnalytics(e.target.checked)}/></label><label><span><strong>{t('Marketing')}</strong><small>{t('Advertising and campaign measurement. Disabled until you consent.')}</small></span><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)}/></label><div className={s.actions}><button onClick={() => save(analytics, marketing)}>{t('Save preferences')}</button><button onClick={() => save(false, false)}>{t('Reject non-essential')}</button><button onClick={() => save(true, true)}>{t('Accept all')}</button></div></dialog>}
  </>, document.body)}</Context.Provider>;
}
