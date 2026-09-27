'use client';
import { Text, Localized } from './../../../components/i18n/Provider';
import LanguageSelect from '../../../components/i18n/LanguageSelect';
import en from './../../../locales/en.json';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Copy, Download, Globe2, QrCode, Smartphone, ArrowLeft, Clock3, AlertCircle } from 'lucide-react';
import styles from './page.module.css';

const example = { address: 'demo.morrowgo.invalid', code: 'DEMO-NOT-AN-ACTIVATION-CODE', reference: 'MG-DEMO-001' };
const views = {
  ready: { title: en["m_65bdcef302c1"], description: en["m_6924a11eeeb9"], label: 'Ready to install · example' },
  waiting: { title: en["m_c2afbc0ddd84"], description: en["m_dea259663e03"], label: 'Awaiting eSIM · example' },
  attention: { title: en["m_c87fdfb865f0"], description: en["m_471e520971a0"], label: 'Needs attention · example' }
};

export default function DemoOrder() {
  const [state, setState] = useState('ready');
  const [method, setMethod] = useState('iphone');
  const [notice, setNotice] = useState('');
  const view = views[state];
  async function copy(value, label) {
    try { await navigator.clipboard.writeText(value); setNotice(`${label} copied — demonstration only.`); }
    catch { setNotice(en["m_a6a2938a72bb"]); }
  }
  return <main className={styles.page}>
    <header className={styles.nav}>
      <Link href="/" className={styles.brand}><Text>{en["m_eef9e6b1a9f1"]}</Text><span>®</span></Link>
      <Link href="/destinations"><Text>{en["m_628851f6f56a"]}</Text><ArrowUpRight size={16} /></Link>
      <LanguageSelect/>
    </header>
    <div className={styles.banner}><span><Text>{en["m_53723b164654"]}</Text></span><Text>{en["m_c1cdd5262781"]}</Text></div>
    <div className={styles.content}>
      <div className={styles.topline}><Link href="/destinations"><ArrowLeft size={15} /><Text>{en["m_f484f35241e4"]}</Text></Link><span><Text>{en["m_45108f49c552"]}</Text><Text>{example.reference}</Text></span></div>
      <section className={styles.hero}>
        <p className={styles.eyebrow}><Text>{en["m_a2c9e75e18e5"]}</Text></p>
        <h1><Text>{view.title}</Text></h1>
        <p className={styles.description}><Text>{view.description}</Text></p>
        <div className={styles.preview}><label htmlFor="preview-state"><Text>{en["m_d86f09e01f44"]}</Text></label><select id="preview-state" value={state} onChange={e => { setState(e.target.value); setNotice(''); }}><option value="ready"><Text>{en["m_0bd33df8e509"]}</Text></option><option value="waiting"><Text>{en["m_944ea5e9b0a7"]}</Text></option><option value="attention"><Text>{en["m_a126722ec044"]}</Text></option></select></div>
      </section>
      <div className={styles.grid}>
        <aside className={styles.summary}>
          <div className={styles.countryIcon}><Globe2 size={30} strokeWidth={1.2} /></div>
          <p className={styles.eyebrow}><Text>{en["m_8ddd44feecb6"]}</Text></p><h2><Text>{en["m_17d53e0e6a68"]}</Text></h2><p className={styles.muted}><Text>{en["m_0973a855f93e"]}</Text></p>
          <div className={styles.plan}><strong>5 <span><Text>{en["m_505a44facaa3"]}</Text></span></strong><span><Text>{en["m_7d4278a87590"]}</Text><br /><Text>{en["m_f340a8a50b38"]}</Text></span></div>
          <dl className={styles.details}><div><dt><Text>{en["m_6512ee1541e9"]}</Text></dt><dd><Text>{en["m_c646cf24f147"]}</Text></dd></div><div><dt><Text>{en["m_7f77efd53d19"]}</Text></dt><dd><Text>{en["m_722360c4795e"]}</Text></dd></div><div><dt><Text>{en["m_b41a92bed032"]}</Text></dt><dd><Text>{en["m_cb049862b62d"]}</Text></dd></div></dl>
          <div className={styles.status}><Text>{state === 'ready' ? <Check size={16} /> : state === 'waiting' ? <Clock3 size={16} /> : <AlertCircle size={16} />}{view.label}</Text></div>
          <p className={styles.small}><Text>{en["m_0b505190a180"]}</Text></p>
        </aside>
        <Localized as="section" className={styles.install} aria-label={en["m_a5c8a81feef8"]}>
          <Text>{state === 'ready' ? <>
            <div className={styles.sectionTitle}><div><p className={styles.eyebrow}><Text>{en["m_06325572a176"]}</Text></p><h2><Text>{en["m_7a71cf016f5c"]}</Text></h2></div><QrCode size={25} strokeWidth={1.3} /></div>
            <div className={styles.qrRow}><div className={styles.qrCard}><Localized as="img" src="/demo-order-qr.svg" width="208" height="208" alt={en["m_3124ccd3baf1"]} /><span><Text>{en["m_ba51971ce21f"]}</Text></span></div><div className={styles.qrText}><h3><Text>{en["m_22ff47c72a7a"]}</Text></h3><p><Text>{en["m_8a69769f867b"]}</Text></p><p className={styles.demoNote}><Text>{en["m_c2134b51c540"]}</Text></p><a className={styles.download} href="/demo-order-qr.svg" download="morrowgo-demo-qr.svg"><Download size={16} /><Text>{en["m_e08559f8acb1"]}</Text></a></div></div>
            <Localized as="div" className={styles.methodPicker} role="group" aria-label={en["m_f2634ab2364b"]}><Text>{[['iphone','iPhone'],['android','Android'],['manual',en["m_1d81ab422262"]]].map(([id,label]) => <button key={id} type="button" aria-pressed={method === id} onClick={() => { setMethod(id); setNotice(''); }} className={method === id ? styles.selected : ''}><Text>{label}</Text></button>)}</Text></Localized>
            <Text>{method !== 'manual' ? <div className={styles.instructions}>
              <p className={styles.small}><Text>{en["m_c549cb0825eb"]}</Text></p>
              <ol><Text>{(method === 'iphone' ? [en["m_8efa7e26108a"], en["m_4b7636758950"], en["m_c053ae40b688"]] : [en["m_91eccb6e5eb0"], en["m_65755ba95388"], en["m_11716b0bf48b"]]).map((step,i) => <li key={step}><span><Text>{String(i+1).padStart(2,'0')}</Text></span><p><Text>{step}</Text></p></li>)}</Text></ol>
            </div> : <div className={styles.manual}><p className={styles.small}><Text>{en["m_46b9c1e4cb36"]}</Text></p><Text>{[[en["m_0485074ecc16"],example.address],[en["m_e0a372431167"],example.code]].map(([label,value]) => <div className={styles.copyRow} key={label}><div><span><Text>{label}</Text></span><code>{value}</code></div><Localized as="button" type="button" aria-label={`Copy sample ${label}`} onClick={() => copy(value,label)}><Copy size={17} /></Localized></div>)}</Text></div>}</Text>
            <p className={styles.notice} role="status" aria-live="polite"><Text>{notice}</Text></p>
          </> : <div className={styles.empty}><Text>{state === 'waiting' ? <Clock3 size={48} strokeWidth={1} /> : <AlertCircle size={48} strokeWidth={1} />}</Text><h2><Text>{state === 'waiting' ? en["m_533224e291c5"] : en["m_d6a96faa618f"]}</Text></h2><p><Text>{state === 'waiting' ? en["m_67f128a873cc"] : en["m_23656790813d"]}</Text></p><span><Text>{en["m_54e64564ec91"]}</Text></span><button type="button" onClick={() => setState('ready')}><Text>{en["m_cc426b7a9869"]}</Text><ArrowUpRight size={16} /></button></div>}</Text>
        </Localized>
      </div>
      <section className={styles.before}><Smartphone size={24} strokeWidth={1.2} /><div><h3><Text>{en["m_0123c7d650b7"]}</Text></h3><p><Text>{en["m_ad118735b01c"]}</Text></p></div></section>
      <footer className={styles.footer}><span><Text>{en["m_303107e2dd8f"]}</Text></span><span><Text>{en["m_05fd6184c76e"]}</Text></span></footer>
    </div>
  </main>;
}
