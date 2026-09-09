'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Copy, Download, Globe2, QrCode, Smartphone, ArrowLeft, Clock3, AlertCircle } from 'lucide-react';
import styles from './page.module.css';

const example = { address: 'demo.morrowgo.invalid', code: 'DEMO-NOT-AN-ACTIVATION-CODE', reference: 'MG-DEMO-001' };
const views = {
  ready: { title: 'Your next connection.', description: 'An example of how your eSIM will appear when it is ready to install.', label: 'Ready to install · example' },
  waiting: { title: 'A little closer to takeoff.', description: 'This example shows an order waiting for its eSIM. Installation details will appear here once it is ready.', label: 'Awaiting eSIM · example' },
  attention: { title: 'Your order needs attention.', description: 'This example shows a delayed order. No installation details are available yet.', label: 'Needs attention · example' }
};

export default function DemoOrder() {
  const [state, setState] = useState('ready');
  const [method, setMethod] = useState('iphone');
  const [notice, setNotice] = useState('');
  const view = views[state];
  async function copy(value, label) {
    try { await navigator.clipboard.writeText(value); setNotice(`${label} copied — demonstration only.`); }
    catch { setNotice('Copy unavailable. Select the example text and copy it manually.'); }
  }
  return <main className={styles.page}>
    <header className={styles.nav}>
      <Link href="/" className={styles.brand}>MORROWGO<span>®</span></Link>
      <Link href="/destinations">Explore destinations <ArrowUpRight size={16} /></Link>
    </header>
    <div className={styles.banner}><span>DEMO EXPERIENCE</span> Sample order. No payment, purchase or working eSIM. The QR code contains demo text only.</div>
    <div className={styles.content}>
      <div className={styles.topline}><Link href="/destinations"><ArrowLeft size={15} /> All destinations</Link><span>ORDER {example.reference}</span></div>
      <section className={styles.hero}>
        <p className={styles.eyebrow}>YOUR TRIP. CONNECTED.</p>
        <h1>{view.title}</h1>
        <p className={styles.description}>{view.description}</p>
        <div className={styles.preview}><label htmlFor="preview-state">Preview order state</label><select id="preview-state" value={state} onChange={e => { setState(e.target.value); setNotice(''); }}><option value="ready">Ready to install</option><option value="waiting">Awaiting eSIM</option><option value="attention">Needs attention</option></select></div>
      </section>
      <div className={styles.grid}>
        <aside className={styles.summary}>
          <div className={styles.countryIcon}><Globe2 size={30} strokeWidth={1.2} /></div>
          <p className={styles.eyebrow}>DESTINATION</p><h2>Germany</h2><p className={styles.muted}>One trip. More possibilities.</p>
          <div className={styles.plan}><strong>5 <span>GB</span></strong><span>30 days<br />Example plan</span></div>
          <dl className={styles.details}><div><dt>Connection</dt><dd>Data only</dd></div><div><dt>Order type</dt><dd>Demonstration</dd></div><div><dt>Payment</dt><dd>No charge</dd></div></dl>
          <div className={styles.status}>{state === 'ready' ? <Check size={16} /> : state === 'waiting' ? <Clock3 size={16} /> : <AlertCircle size={16} />}{view.label}</div>
          <p className={styles.small}>Plan details are illustrative. No supplier has been selected for this example.</p>
        </aside>
        <section className={styles.install} aria-label="Installation preview">
          {state === 'ready' ? <>
            <div className={styles.sectionTitle}><div><p className={styles.eyebrow}>01 / INSTALL YOUR ESIM</p><h2>A scan away.</h2></div><QrCode size={25} strokeWidth={1.3} /></div>
            <div className={styles.qrRow}><div className={styles.qrCard}><img src="/demo-order-qr.svg" width="208" height="208" alt="Demonstration QR code containing text only, not an eSIM activation code" /><span>DEMO · NOT FOR INSTALLATION</span></div><div className={styles.qrText}><h3>Your connection starts here.</h3><p>In a completed order, scan the QR code from another screen using your phone’s eSIM settings.</p><p className={styles.demoNote}>This sample QR cannot install an eSIM.</p><a className={styles.download} href="/demo-order-qr.svg" download="morrowgo-demo-qr.svg"><Download size={16} /> Save sample QR</a></div></div>
            <div className={styles.methodPicker} role="group" aria-label="Installation method">{[['iphone','iPhone'],['android','Android'],['manual','Manual setup']].map(([id,label]) => <button key={id} type="button" aria-pressed={method === id} onClick={() => { setMethod(id); setNotice(''); }} className={method === id ? styles.selected : ''}>{label}</button>)}</div>
            {method !== 'manual' ? <div className={styles.instructions}>
              <p className={styles.small}>Example guide · menu names depend on your device.</p>
              <ol>{(method === 'iphone' ? ['Connect to Wi-Fi and open Settings → Cellular / Mobile Service.', 'Choose Add eSIM → Use QR Code. Scan the real code provided with your order.', 'Follow the on-screen instructions and label your travel line “MORROWGO”.'] : ['Connect to Wi-Fi and open Settings → Connections / Network & internet.', 'Open SIM manager / SIMs and choose the option to add an eSIM.', 'Scan the real code from your order and follow the on-screen instructions.']).map((step,i) => <li key={step}><span>{String(i+1).padStart(2,'0')}</span><p>{step}</p></li>)}</ol>
            </div> : <div className={styles.manual}><p className={styles.small}>Sample values only. Do not enter them in your phone settings.</p>{[['SM-DP+ address',example.address],['Activation code',example.code]].map(([label,value]) => <div className={styles.copyRow} key={label}><div><span>{label}</span><code>{value}</code></div><button type="button" aria-label={`Copy sample ${label}`} onClick={() => copy(value,label)}><Copy size={17} /></button></div>)}</div>}
            <p className={styles.notice} role="status" aria-live="polite">{notice}</p>
          </> : <div className={styles.empty}>{state === 'waiting' ? <Clock3 size={48} strokeWidth={1} /> : <AlertCircle size={48} strokeWidth={1} />}<h2>{state === 'waiting' ? 'Installation details are on their way.' : 'Installation is not available yet.'}</h2><p>{state === 'waiting' ? 'A real order will show its QR code and setup instructions here after the eSIM is issued.' : 'A real order may need a review before its eSIM can be issued. A payment confirmation alone does not mean the eSIM is ready.'}</p><span>Demonstration only · no order is being processed</span><button type="button" onClick={() => setState('ready')}>Preview ready order <ArrowUpRight size={16} /></button></div>}
        </section>
      </div>
      <section className={styles.before}><Smartphone size={24} strokeWidth={1.2} /><div><h3>Before you connect</h3><p>For a real eSIM, check that your phone supports eSIM and is carrier-unlocked. Follow your plan’s activation and roaming instructions before travelling.</p></div></section>
      <footer className={styles.footer}><span>MORROWGO / GO FURTHER.</span><span>Sample experience · no live activation</span></footer>
    </div>
  </main>;
}
