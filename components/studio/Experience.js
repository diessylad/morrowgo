'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowUpRight, ArrowRight, Search, Globe2, Signal, Check, Plus, Minus, X, ShieldCheck, Smartphone, Headphones, ChevronLeft, Zap, Layers, MessageSquare, BatteryMedium } from 'lucide-react';
import s from './studio.module.css';

const countries = [
  { name: 'Japan', flag: '🇯🇵', code: 'JP', region: 'Asia', city: 'Tokyo', zone: '35.67° N / 139.65° E' },
  { name: 'Italy', flag: '🇮🇹', code: 'IT', region: 'Europe', city: 'Rome', zone: '41.90° N / 12.49° E' },
  { name: 'USA', flag: '🇺🇸', code: 'US', region: 'Americas', city: 'New York', zone: '40.71° N / 74.00° W' },
  { name: 'Thailand', flag: '🇹🇭', code: 'TH', region: 'Asia', city: 'Bangkok', zone: '13.75° N / 100.50° E' },
  { name: 'France', flag: '🇫🇷', code: 'FR', region: 'Europe', city: 'Paris', zone: '48.85° N / 2.35° E' },
  { name: 'Spain', flag: '🇪🇸', code: 'ES', region: 'Europe', city: 'Madrid', zone: '40.41° N / 3.70° W' }
];
const plans = [{ gb: 1, days: 7, price: 4.5 }, { gb: 3, days: 15, price: 9.9 }, { gb: 5, days: 30, price: 14.9 }, { gb: 10, days: 30, price: 24.9 }];
const money = n => `€${n.toFixed(2)}`;
function Mark() { return <span className={s.mark} aria-hidden="true"><i/><i/><i/><i/></span>; }
function Arrow({ diagonal = false }) { return diagonal ? <ArrowUpRight size={19}/> : <ArrowRight size={19}/>; }

export default function Experience() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('All');
  const [country, setCountry] = useState(countries[0]);
  const [plan, setPlan] = useState(1);
  const [stage, setStage] = useState('plans');
  const [method, setMethod] = useState('Card');
  const [details, setDetails] = useState(false);
  const scene = useRef(null);
  const root = useRef(null);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (media.matches) return;
    const elements = root.current.querySelectorAll('[data-reveal]');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.animate([{ opacity: .65, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 550, easing: 'cubic-bezier(.2,.8,.2,1)' });
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: .12 });
    elements.forEach(el => observer.observe(el));
    const el = scene.current;
    let frame;
    function reset() { el.style.setProperty('--pointer-x', '0px'); el.style.setProperty('--pointer-y', '0px'); }
    function move(event) {
      if (media.matches || event.pointerType !== 'mouse') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        el.style.setProperty('--pointer-x', `${((event.clientX - rect.left) / rect.width - .5) * 9}px`);
        el.style.setProperty('--pointer-y', `${((event.clientY - rect.top) / rect.height - .5) * 7}px`);
      });
    }
    function leave() { cancelAnimationFrame(frame); reset(); }
    function preferenceChange() { if (media.matches) { observer.disconnect(); leave(); root.current.getAnimations({ subtree: true }).forEach(animation => animation.cancel()); } }
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    media.addEventListener('change', preferenceChange);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave); media.removeEventListener('change', preferenceChange); };
  }, []);
  const dialog = useRef(null);
  const search = useRef(null);
  const trigger = useRef(null);
  const filtered = countries.filter(c => `${c.name} ${c.region} ${c.code}`.toLowerCase().includes(query.toLowerCase().trim()) && (region === 'All' || c.region === region));
  function open(c, event) { trigger.current = event?.currentTarget; setCountry(c); setPlan(1); setStage('plans'); setDetails(false); dialog.current.showModal(); }
  function close() { dialog.current.close(); trigger.current?.focus(); }
  function goSearch() { search.current.focus(); search.current.scrollIntoView({ behavior: 'auto', block: 'center' }); }
  const selected = plans[plan];
  return <div className={s.root} ref={root}>
    <a href="#content" className={s.skip}>Skip to content</a>
    <header className={s.header}>
      <a className={s.wordmark} href="/" aria-label="MORROWGO home"><Mark/>MORROWGO</a>
      <nav aria-label="Main navigation"><a href="#destinations">Destinations</a><a href="#how">How it works</a><a href="#product">The experience</a></nav>
      <button className={s.navCta} onClick={goSearch}>Find your eSIM <Arrow/></button>
    </header>
    <main id="content">
      <section className={s.hero} aria-labelledby="hero-title">
        <div className={s.heroLayout}>
          <div className={s.heroCopy}>
            <div className={s.networkLabel}><i className={s.dot}/> GLOBAL eSIM NETWORK</div>
            <h1 id="hero-title">Stay<br/>Connected<br/>Further</h1>
            <p className={s.heroDescription}>Instant eSIM for 200+ countries.<br/>No borders. No extra fees. Just freedom.</p>
            
            <form className={s.search} onSubmit={e => { e.preventDefault(); if (filtered.length === 1) open(filtered[0], { currentTarget: search.current }); else document.getElementById('destinations').scrollIntoView(); }}>
              <Search size={22}/><label className={s.srOnly} htmlFor="destination-search">Where are you going?</label>
              <input ref={search} id="destination-search" placeholder="Where are you going?" value={query} onChange={e => { setQuery(e.target.value); setRegion('All'); }}/>
              <button aria-label="Search destinations"><Arrow/></button>
            </form>
            <div className={s.heroBenefits}>{[[Zap, 'Instant activation'], [Signal, 'Reliable coverage'], [BatteryMedium, 'No physical SIM'], [Globe2, '200+ countries']].map(([Icon, text]) => <div key={text}><Icon size={21} strokeWidth={1.5}/><span>{text}</span></div>)}</div>
          </div>
          <div className={s.heroScene} ref={scene} aria-label="MORROWGO app interface preview">
            <div className={s.apeArtwork}><Image src="/brand/editorial-ape-right.png" alt="" width={1122} height={1402} sizes="(max-width: 700px) 1px, 340px" priority/></div>
            <span className={s.sceneWords}>PEOPLE<br/>PLACES<br/>STORIES<br/>ALWAYS<br/>CONNECTED<span/></span>
            <button className={s.japanFloat} onClick={e => open(countries[0], e)}>
              <span className={s.destinationArt} aria-hidden="true"><svg viewBox="0 0 240 170" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="fuji-sky" x2="0" y2="1"><stop stopColor="#afbdc4"/><stop offset="1" stopColor="#e0e0d5"/></linearGradient><linearGradient id="fuji-rock" x2=".7" y2="1"><stop stopColor="#cbd0cd"/><stop offset="1" stopColor="#465968"/></linearGradient></defs><path fill="url(#fuji-sky)" d="M0 0h240v170H0z"/><path fill="#a7b5b9" d="M0 138 54 108 77 121 121 93 173 119 200 104 240 129v41H0z"/><path fill="url(#fuji-rock)" d="m18 158 95-117 17-5 13 8 88 114z"/><path fill="#d8dedc" d="m84 78 29-37 17-5 13 8 26 36-22-13 3 15-20-27-5 23-6-20-16 28 5-23z"/><path stroke="#8d9ea4" strokeWidth="2" fill="none" d="m119 68-39 69m52-78 24 85m-34-59-7 59m38-53 31 58"/><path fill="#233b42" d="m0 138 19 5 18-12 21 9 23-9 25 19 29-11 26 12 31-12 48-13v44H0z"/><g fill="#172b2d"><path d="m203 83-8 19h5l-12 22h8l-16 25h20v21h5v-21h20l-17-25h9l-12-22h5z"/><path d="m227 101-8 18h5l-13 25h11v26h5v-26h13l-11-25h6z"/><path d="m23 121-12 27h8v22h6v-22h10z"/></g></svg></span>
              <span className={s.japanName}>Japan <span>🇯🇵</span></span><span className={s.japanPrice}>From €4.50 <Arrow/></span>
            </button>
            <div className={s.editorialFloat}><span>Travel<br/>Without<br/>Limits</span><div>MORROWGO <Arrow diagonal/></div></div>
            <button className={s.heroDeviceAsset} onClick={e => open(countries[0], e)} aria-label="Open Japan eSIM plans">
              <Image src="/brand/hero-japan-phone.png" alt="MORROWGO Japan eSIM on a premium smartphone" width={1086} height={1448} sizes="(max-width: 700px) 58vw, 390px" priority/>
            </button>
            <div className={s.connectionNote}>A<br/>BETTER<br/>TOMORROW<br/>CONNECTS<br/>PEOPLE<span/></div>
          </div>
        </div>
        <div className={s.demoNote}>Design prototype · Sample destinations, prices and usage. No payment or eSIM is issued.</div>
      </section>
      <section id="destinations" className={s.section} data-reveal aria-labelledby="dest-title">
        <div className={s.sectionTitle}><span className={s.index}>01 / EXPLORE</span><h2 id="dest-title">Where to next?</h2><span className={s.secondary}>A small world.<br/>A lot to discover.</span></div>
        <div className={s.filters} aria-label="Filter destinations">{['All', 'Europe', 'Asia', 'Americas'].map(r => <button key={r} aria-pressed={region === r} onClick={() => setRegion(r)}>{r === 'All' ? 'Popular destinations' : r}</button>)}<span aria-live="polite">{filtered.length} destinations</span></div>
        <div className={s.destinationGrid}>{filtered.map(c => <button key={c.code} className={s.destination} onClick={e => open(c, e)}>
          <span className={s.destMeta}>{c.region}<span>{c.code}</span></span><span className={s.flag} aria-hidden="true">{c.flag}</span><span className={s.destName}>{c.name}</span><span className={s.destPrice}>From €4.50 <Arrow diagonal/></span>
        </button>)}</div>
        {!filtered.length && <div className={s.empty}><p>No matching destinations in this preview.</p><button onClick={() => { setQuery(''); setRegion('All'); }}>Show all sample destinations <Arrow/></button></div>}
      </section>
      <section id="how" className={`${s.section} ${s.how}`} data-reveal aria-labelledby="how-title"><div><span className={s.index}>02 / NO FRICTION</span><h2 id="how-title">Three steps.<br/>Then you’re there.</h2></div><div className={s.steps}>{[['Choose your plan', 'Your destination. Your data.'], ['Pay securely', 'One clear total.'], ['Get connected', 'Install your eSIM and go.']].map(([title, text], i) => <div key={title}><span>0{i + 1}</span><h3>{title}</h3><p>{text}</p></div>)}</div></section>
      <section id="product" className={`${s.product} ${s.referenceNative}`} data-reveal aria-labelledby="product-title">
        <div className={s.productIntro}>
          <span className={s.index}>03</span><h2 id="product-title">All your<br/>connections<br/>in one app.</h2>
          <p>Buy. Install. Manage. Anytime, anywhere.</p><div className={s.comingSoon}>COMING SOON</div>
          <div className={s.storeLabels} aria-label="Coming soon on App Store and Google Play"><span>App Store <small>Coming soon</small></span><span>Google Play <small>Coming soon</small></span></div>
        </div>
        <div className={s.adDeviceAsset} aria-hidden="true">
          <Image src="/brand/app-phone-closeup.png" alt="" width={1122} height={1402} sizes="(max-width: 700px) 72vw, 460px"/>
        </div>
        <div className={s.adFeatures}><div><Signal size={23}/><span>Track your data</span></div><button onClick={e => open(countries[0], e)} aria-label="Top up"><Plus size={23}/><span>Top up anytime</span></button><div><Layers size={23}/><span>Manage multiple eSIMs</span></div><div><MessageSquare size={23}/><span>Get support 24/7<small>Planned app feature</small></span></div></div>
        <span className={s.adWords}>SAME<br/>WORLD<br/>MORE<br/>FREEDOM<i/></span>
      </section>
      <section className={s.finalCta}><span className={s.index}>READY WHEN YOU ARE</span><h2>Go further.<br/>Stay connected.</h2><button className={s.navCta} onClick={goSearch}>Find your eSIM <Arrow/></button><div className={s.trust}>{[[Globe2, '200+ countries'], [ShieldCheck, 'Secure payment'], [BatteryMedium, 'No physical SIM'], [Headphones, 'Support']].map(([Icon, text]) => <span key={text}><Icon size={18}/>{text}</span>)}</div></section>
    </main>
    <footer className={s.footer}><a href="/" className={s.wordmark}><Mark/>MORROWGO</a><span>More places. Brighter tomorrows.</span><span>© 2026 MORROWGO · Design preview</span></footer>
    <dialog ref={dialog} className={s.dialog} onCancel={() => trigger.current?.focus()} onClick={e => { if (e.target === dialog.current) close(); }}>
      <div className={s.dialogBody}><div className={s.dialogHeader}><span>MORROWGO / PRODUCT PREVIEW</span><button onClick={close} aria-label="Close preview"><X size={22}/></button></div>
        {stage !== 'plans' && <button className={s.back} onClick={() => { setStage('plans'); setDetails(false); }}><ChevronLeft size={16}/> Back to plans</button>}
        <div aria-live="polite">
        <span className={s.index}>{stage === 'active' ? 'YOUR eSIM / DEMO' : country.region.toUpperCase()}</span><h2>{country.flag} {country.name}</h2>
        {stage === 'plans' && <><p>Choose your connection.</p><fieldset className={s.planList}><legend className={s.srOnly}>Select a data plan</legend>{plans.map((p, i) => <label className={plan === i ? s.chosen : ''} key={p.gb}><input type="radio" name="data-plan" checked={plan === i} onChange={() => setPlan(i)}/><span><b>{p.gb} GB</b><small>{p.days} days · Data only</small></span><strong>{money(p.price)}</strong></label>)}</fieldset><p className={s.finePrint}>An unlocked, eSIM-compatible device is required. All plans shown here are sample data.</p><button className={s.pay} onClick={() => setStage('checkout')}>Continue · {money(selected.price)} <Arrow/></button></>}
        {stage === 'checkout' && <><p>One plan. Everything clear.</p><div className={s.summary}><span>{selected.gb} GB / {selected.days} days</span><b>{money(selected.price)}</b></div><fieldset className={s.methods}><legend>Payment method preview</legend>{['Apple Pay', 'Google Pay', 'Card', 'PayPal'].map(m => <label key={m}><input type="radio" name="payment-method" checked={m === method} onChange={() => setMethod(m)}/>{m}</label>)}</fieldset><div className={s.summary}><span>Total</span><b>{money(selected.price)}</b></div><p className={s.finePrint}>Demo only. No payment details are collected and no charge will be made.</p><button className={s.pay} onClick={() => setStage('active')}>Simulate payment · {money(selected.price)} <ShieldCheck size={18}/></button></>}
        {stage === 'active' && <><span className={s.demoActive}><Check size={16}/> Demo eSIM active</span><div className={s.balance}>{selected.gb} <span>GB remaining</span></div><div className={s.meter}><i style={{ width: '100%' }}/></div><p>{selected.days} days left · Sample state</p><button className={s.pay} onClick={() => setStage('plans')}>Explore top-up plans <Plus size={18}/></button><button className={s.detailButton} aria-expanded={details} onClick={() => setDetails(!details)}>Plan & installation details {details ? <Minus size={18}/> : <Plus size={18}/>}</button>{details && <p className={s.finePrint}>Preview: {selected.gb} GB of data in {country.name} for {selected.days} days. In a live purchase, installation instructions would appear after your eSIM is issued. This demo creates no eSIM and has no installation code.</p>}</>}
        </div>
      </div>
    </dialog>
  </div>;
}
