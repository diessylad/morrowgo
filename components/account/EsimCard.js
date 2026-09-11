'use client';

import { useState } from 'react';
import { ChevronDown, Copy, Globe2, Plus } from 'lucide-react';
import styles from './account.module.css';

const statusLabels = {
  active: 'Active', ready: 'Ready to install', pending: 'Preparing',
  inactive: 'Not activated', expired: 'Expired', depleted: 'Data used',
  suspended: 'Paused', failed: 'Needs attention', cancelled: 'Cancelled',
  awaiting_fulfillment: 'Awaiting eSIM', processing: 'Preparing'
};

function dateLabel(value) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(time) : null;
}

function timestampLabel(value) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(time) + ' UTC' : null;
}

function destinationLabel(esim) {
  if (esim.destinationName) return esim.destinationName;
  if (/^[A-Z]{2}$/.test(esim.destinationIso || '')) {
    try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(esim.destinationIso); } catch { return esim.destinationIso; }
  }
  return 'Travel eSIM';
}

export default function EsimCard({ esim, usage = {}, demo = false, asOf }) {
  const [notice, setNotice] = useState('');
  const [topUpOpen, setTopUpOpen] = useState(false);
  const now = asOf ? Date.parse(asOf) : Date.now();
  const expiry = Date.parse(esim.expiresAt);
  const days = Number.isFinite(expiry) && Number.isFinite(now) ? Math.max(0, Math.ceil((expiry - now) / 86400000)) : null;
  const updatedAt = timestampLabel(esim.usageUpdatedAt);
  const orderedAt = dateLabel(esim.orderedAt);
  const expiryDate = dateLabel(esim.expiresAt);
  const remainingPercent = typeof usage.remainingPercent === 'number' && Number.isFinite(usage.remainingPercent) ? Math.max(0, Math.min(100, usage.remainingPercent)) : null;
  const networkNames = Array.isArray(esim.networks) ? esim.networks.filter(item => typeof item === 'string' && item.trim()).join(' / ') : '';
  const install = esim.installDetails || {};
  const installFields = [['SM-DP+ address', install.smdpAddress], ['Activation code', install.activationCode], ['Confirmation code', install.confirmationCode]].filter(([, value]) => typeof value === 'string' && value.trim());

  async function copy(value, label) {
    try { await navigator.clipboard.writeText(value); setNotice(`${label} copied.${demo ? ' Demonstration only.' : ''}`); }
    catch { setNotice('Copy unavailable. Select the value and copy it manually.'); }
  }

  return <article className={styles.card}>
    <div className={styles.cardTop}>
      <div className={styles.destination}><span className={styles.destinationIcon}><Globe2 size={22} strokeWidth={1.2} /></span><h3>{destinationLabel(esim)}</h3></div>
      <span className={styles.badge}>{statusLabels[esim.status] || 'Status unavailable'}{demo ? ' · demo' : ''}</span>
    </div>
    <p className={styles.planName}>{esim.planName || 'Plan information pending'}{demo ? ' · example plan' : ''}</p>
    <div className={styles.usage}>
      {usage.isUnlimited === true ? <p className={styles.remaining}>Unlimited data</p> : usage.remainingLabel ? <p className={styles.remaining}>{usage.remainingLabel}<small>remaining</small></p> : <p className={styles.usageUnknown}>Usage not available yet.</p>}
      <div className={styles.usageLine}><span>{usage.usedLabel ? `${usage.usedLabel} used` : 'Used data not reported'}</span>{remainingPercent !== null && <span>{Math.round(remainingPercent)}% remaining</span>}</div>
      {remainingPercent !== null && <div className={styles.progress} role="progressbar" aria-label={`Data remaining for ${destinationLabel(esim)}`} aria-valuenow={Math.round(remainingPercent)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${remainingPercent}%` }} /></div>}
      <p className={styles.muted}>{updatedAt ? `${demo ? 'Example reading' : 'Last reported'} ${updatedAt}.` : 'A usage reading will appear when it is available.'}{!demo && updatedAt ? ' Usage may have changed since this reading.' : ''}</p>
    </div>
    <dl className={styles.details}>
      <div><dt>Plan size</dt><dd>{usage.initialLabel || 'Not reported'}</dd></div>
      <div><dt>Validity</dt><dd>{days !== null ? <>{days === 0 ? 'Validity ended' : `${days} ${days === 1 ? 'day' : 'days'} remaining`}<br /><span className={styles.muted}>{expiryDate ? `Until ${expiryDate}` : ''}</span></> : esim.validityDays ? `${esim.validityDays} days · start date not reported` : 'Not reported'}</dd></div>
      <div><dt>Network</dt><dd>{networkNames || 'Not reported'}</dd></div>
      <div><dt>Connection</dt><dd>{esim.supports5G === true ? '5G supported' : esim.supports5G === false ? '5G not included' : 'Not reported'}</dd></div>
      <div><dt>Ordered</dt><dd>{orderedAt || 'Date not available'}</dd></div>
    </dl>
    {esim.rechargeable === true && <div className={styles.actions}><button className={`${styles.button} ${styles.secondary}`} type="button" onClick={() => setTopUpOpen(!topUpOpen)} aria-expanded={topUpOpen}><Plus size={15} />Top up</button></div>}
    {topUpOpen && <p className={styles.notice} role="status">This {demo ? 'example ' : ''}plan supports top-ups. Top-up ordering is not open yet. No purchase has been started.</p>}
    <details className={styles.install}>
      <summary>Installation details <ChevronDown size={16} /></summary>
      {installFields.length ? <><p className={styles.muted}>{demo ? 'Sample values only. They cannot install an eSIM.' : 'Keep these values private. Follow your phone’s manual eSIM setup instructions and your plan’s activation terms.'}</p>{installFields.map(([label, value]) => <div className={styles.copyRow} key={label}><div><span>{label}</span><code>{value}</code></div><button aria-label={`Copy ${demo ? 'sample ' : ''}${label}`} type="button" onClick={() => copy(value, label)}><Copy size={16} /></button></div>)}</> : <p className={styles.muted}>Installation details are not available yet. They will appear after your eSIM is issued.</p>}
      <p className={styles.notice} aria-live="polite" role="status">{notice}</p>
    </details>
  </article>;
}
