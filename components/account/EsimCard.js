'use client';
import { Text, Localized, useLanguage } from './../i18n/Provider';
import en from './../../locales/en.json';

import { countryFlag } from '../../lib/account/presentation.mjs';
import { useEffect, useState } from 'react';
import { ChevronDown, Copy, Globe2, Plus } from 'lucide-react';
import styles from './account.module.css';
import InstallationPanel from './InstallationPanel';
import { SandboxNote } from './ExperienceUI';
import Link from 'next/link';
import {motion,useReducedMotion} from 'motion/react';
import {getUsageSummary} from '../../lib/esims/usage';

const statusLabels = {
  active: en["m_a733b809d2f1"], ready: en["m_0bd33df8e509"], pending: en["m_96a9b7cdbe40"],
  inactive: en["m_eb9a4c13c172"], expired: en["m_a689a999a5e6"], depleted: en["m_df840af3d757"],
  suspended: en["m_c7dfb6f1d9c5"], failed: en["m_a126722ec044"], cancelled: en["m_a1bf92eff40d"],
  awaiting_fulfillment: en["m_944ea5e9b0a7"], processing: en["m_96a9b7cdbe40"]
};

function dateLabel(value, language) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : language, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(time) : null;
}

function timestampLabel(value, language) {
  const time = Date.parse(value);
  return Number.isFinite(time) ? new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(time) + ' UTC' : null;
}

function destinationLabel(esim) {
  if (esim.destinationName) return esim.destinationName;
  if (/^[A-Z]{2}$/.test(esim.destinationIso || '')) {
    try { return new Intl.DisplayNames(['en'], { type: 'region' }).of(esim.destinationIso); } catch { return esim.destinationIso; }
  }
  return en["m_d9efbf5ef99d"];
}

export default function EsimCard({ esim: initialEsim, usage: initialUsage = {}, demo = false, asOf, installationOpen = false, topUpInitiallyOpen = false }) {
  const { language } = useLanguage();
  const reduced = useReducedMotion();
  const [esim,setEsim] = useState(initialEsim);
  const [loading,setLoading] = useState(false);
  const usage = esim === initialEsim ? initialUsage : getUsageSummary(esim);
  async function refresh(){setLoading(true);try{const r=await fetch(`/api/account/esims/${esim.id}/sandbox`);const d=await r.json();if(!r.ok)throw new Error();setEsim(d.esim);setNotice(en["m_44c3e0fe67a0"]);}catch{setNotice(en["m_e2206d8023af"]);}finally{setLoading(false);}}
  const [notice, setNotice] = useState('');
  const [topUpOpen, setTopUpOpen] = useState(topUpInitiallyOpen);
  useEffect(() => { setTopUpOpen(topUpInitiallyOpen); }, [topUpInitiallyOpen]);
  const now = asOf ? Date.parse(asOf) : Date.now();
  const expiry = Date.parse(esim.expiresAt);
  const days = Number.isFinite(expiry) && Number.isFinite(now) ? Math.max(0, Math.ceil((expiry - now) / 86400000)) : null;
  const updatedAt = timestampLabel(esim.usageUpdatedAt, language);
  const orderedAt = dateLabel(esim.orderedAt, language);
  const expiryDate = dateLabel(esim.expiresAt, language);
  const remainingPercent = typeof usage.remainingPercent === 'number' && Number.isFinite(usage.remainingPercent) ? Math.max(0, Math.min(100, usage.remainingPercent)) : null;
  const networkNames = Array.isArray(esim.networks) ? esim.networks.filter(item => typeof item === 'string' && item.trim()).join(' / ') : '';
  const install = esim.installDetails || {};
  const installFields = [[en["m_0485074ecc16"], install.smdpAddress], [en["m_e0a372431167"], install.activationCode], [en["m_4e9e48fdd225"], install.confirmationCode]].filter(([, value]) => typeof value === 'string' && value.trim());

  async function copy(value, label) {
    try { await navigator.clipboard.writeText(value); setNotice(`${label} copied.${demo ? ' Demonstration only.' : ''}`); }
    catch { setNotice(en["m_7263bcf330df"]); }
  }

  return <motion.article initial={{opacity:0,y:reduced?0:6}} animate={{opacity:1,y:0}} transition={{duration:reduced?0:.25}} className={styles.card} id={`esim-${esim.id}`}>
    <div className={styles.cardTop}>
      <div className={styles.destination}><span className={styles.destinationIcon}>{countryFlag(esim.destinationIso)}</span><h3><Text>{destinationLabel(esim)}</Text></h3></div>
      <span className={styles.badge} data-active={esim.status === 'active'}><Text>{statusLabels[esim.status] || en["m_f261ff7629df"]}{demo ? ' · demo' : ''}</Text></span>
    </div>
    <p className={styles.planName}>{esim.planName || en["m_3a3dd9174aa2"]}<Text>{demo ? ' · example plan' : ''}</Text></p>

    {(esim.sandbox || esim.planName?.endsWith(' · Sandbox')) && <SandboxNote/>}
    {['ready','active'].includes(esim.status) && <p className={styles.connectionHint}><Text>{esim.status==='ready'?'Ready to install · Open your QR code below to add this eSIM to your phone.':'Your connection is active. Check the latest reported data balance below.'}</Text></p>}
    <div className={styles.usage}>
      <Text>{usage.isUnlimited === true ? <p className={styles.remaining}><Text>{en["m_c62d56011e87"]}</Text></p> : usage.remainingLabel ? <p className={styles.remaining}><Text>{usage.remainingLabel}</Text><small><Text>{en["m_398658a601d9"]}</Text></small></p> : <p className={styles.usageUnknown}><Text>{en["m_b426c8c16ec9"]}</Text></p>}</Text>
      <div className={styles.usageLine}><span><Text>{usage.usedLabel ? `${usage.usedLabel} used` : en["m_266b93684b42"]}</Text></span><Text>{remainingPercent !== null && <span><Text>{Math.round(remainingPercent)}</Text><Text>{en["m_0ebfc6b7a05d"]}</Text></span>}</Text></div>
      <Text>{remainingPercent !== null && <Localized as="div" className={styles.progress} role="progressbar" aria-label={`Data remaining for ${destinationLabel(esim)}`} aria-valuenow={Math.round(remainingPercent)} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${remainingPercent}%` }} /></Localized>}</Text>
      <p className={styles.muted}><Text>{updatedAt ? `${demo ? en["m_52ba18ffa024"] : en["m_3da47ee2383b"]} ${updatedAt}.` : en["m_34e4a23ee61f"]}{!demo && updatedAt ? ' Usage may have changed since this reading.' : ''}</Text></p>
    </div>
    <dl className={styles.details}>
      <div><dt><Text>{en["m_1a5d0735b430"]}</Text></dt><dd><Text>{usage.initialLabel || en["m_98e856820171"]}</Text></dd></div>
      <div><dt><Text>{en["m_dbc5c52e0738"]}</Text></dt><dd><Text>{days !== null ? <><Text>{days === 0 ? en["m_ce3b1e47ac7a"] : `${days} ${days === 1 ? en["m_a2620cbc10f5"] : en["m_5548ae4f34cb"]} remaining`}</Text><br /><span className={styles.muted}><Text>{expiryDate ? `Until ${expiryDate}` : ''}</Text></span></> : esim.validityDays ? `${esim.validityDays} days · start date not reported` : en["m_98e856820171"]}</Text></dd></div>
      <div><dt><Text>{en["m_53ebc572b4a4"]}</Text></dt><dd>{networkNames || <Text>{en["m_98e856820171"]}</Text>}</dd></div>
      <div><dt><Text>{en["m_6512ee1541e9"]}</Text></dt><dd><Text>{esim.supports5G === true ? en["m_2a5755c840bb"] : esim.supports5G === false ? en["m_08f88d6035f2"] : en["m_98e856820171"]}</Text></dd></div>
      <div><dt><Text>{en["m_c9dd3b77c90c"]}</Text></dt><dd><Text>{orderedAt || en["m_57497eccf823"]}</Text></dd></div>
    </dl>
    <Text>{esim.rechargeable === true && <div className={styles.actions}><button className={`${styles.button} ${styles.secondary}`} type="button" onClick={() => setTopUpOpen(!topUpOpen)} aria-expanded={topUpOpen}><Plus size={15} /><Text>{en["m_91d42a8b742a"]}</Text></button></div>}</Text>
    <Text>{topUpOpen && <p className={styles.notice} role="status"><Text>{en["m_019dbc85609d"]}</Text><Text>{demo ? 'example ' : ''}</Text><Text>{en["m_c339198bce37"]}</Text></p>}</Text>
    {topUpOpen && esim.topups?.map(p => <p className={styles.muted} key={p.id}>{p.title} · €<Text>{p.price.toFixed(2)}</Text></p>)}
    {!demo && ['ready','active'].includes(esim.status) && <InstallationPanel esim={esim} name={destinationLabel(esim)} initiallyOpen={installationOpen} />}
    <details className={styles.install} open={installationOpen || undefined}>
      <summary><Text>{en["m_658efcda8b52"]}</Text><ChevronDown size={16} /></summary>
      <Text>{installFields.length ? <><p className={styles.muted}><Text>{demo ? en["m_ca379a057819"] : en["m_eadcb311f47a"]}</Text></p><Text>{installFields.map(([label, value]) => <div className={styles.copyRow} key={label}><div><span><Text>{label}</Text></span><code>{value}</code></div><Localized as="button" aria-label={`Copy ${demo ? 'sample ' : ''}${label}`} type="button" onClick={() => copy(value, label)}><Copy size={16} /></Localized></div>)}</Text></> : <p className={styles.muted}><Text>{en["m_fe4e9e062220"]}</Text></p>}</Text>
      <Text>{esim.instructions?.map((step,i) => <p className={styles.muted} key={i}><Text>{step}</Text></p>)}</Text>
      <p className={styles.notice} aria-live="polite" role="status"><Text>{notice}</Text></p>
    </details>
    {!demo && <div className={styles.managementActions}><button className={`${styles.button} ${styles.secondary}`} disabled={loading} onClick={refresh}><Text>{loading ? 'Refreshing…' : 'Refresh status'}</Text></button><Link href="/help#contact" className={styles.installHelp}><Text>Need help installing?</Text></Link></div>}
  </motion.article>;
}
