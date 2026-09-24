'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowUpRight, ArrowRight, Search, Globe2, Signal, Check, Plus, Minus, X, ShieldCheck, Smartphone, Headphones, ChevronLeft, Zap, Layers, MessageSquare, BatteryMedium } from 'lucide-react';
import s from './studio.module.css';
import Header from '../shared/Header';
import usePremiumMotion from '../shared/usePremiumMotion';
import motion from '../shared/motion.module.css';
import MotionHeading from '../shared/MotionHeading';
import HeroWaves from './HeroWaves';
import QuickBuy from '../quick-buy/QuickBuy';

const countries = [
  { name: 'Japan', flag: '🇯🇵', code: 'JP', region: 'Asia', city: 'Tokyo', zone: '35.67° N / 139.65° E' },
  { name: 'Italy', flag: '🇮🇹', code: 'IT', region: 'Europe', city: 'Rome', zone: '41.90° N / 12.49° E' },
  { name: 'USA', flag: '🇺🇸', code: 'US', region: 'Americas', city: 'New York', zone: '40.71° N / 74.00° W' },
  { name: 'Thailand', flag: '🇹🇭', code: 'TH', region: 'Asia', city: 'Bangkok', zone: '13.75° N / 100.50° E' },
  { name: 'France', flag: '🇫🇷', code: 'FR', region: 'Europe', city: 'Paris', zone: '48.85° N / 2.35° E' },
  { name: 'Spain', flag: '🇪🇸', code: 'ES', region: 'Europe', city: 'Madrid', zone: '40.41° N / 3.70° W' }
];
const money = n => `€${n.toFixed(2)}`;
function Mark() { return <span className={s.mark} aria-hidden="true"><i/><i/><i/><i/></span>; }
function Arrow({ diagonal = false }) { return diagonal ? <ArrowUpRight size={19}/> : <ArrowRight size={19}/>; }

export default function Experience({ authenticated = false }) {
  const router = useRouter();
  const [catalogue, setCatalogue] = useState([]);
  const [catalogueState, setCatalogueState] = useState('loading');
  useEffect(() => { let active = true; fetch('/api/catalogue/countries').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(d => { if(active){setCatalogue(d.countries);setCatalogueState('ready');} }).catch(() => {if(active)setCatalogueState('error');}); return () => {active=false;}; }, []);
  const [quickBuyCountry, setQuickBuyCountry] = useState(null);
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState('All');
  const scene = useRef(null);
  const root = useRef(null);
  usePremiumMotion(root);
  const search = useRef(null);
  const matches = catalogue.filter(c => `${c.name} ${c.region} ${c.code}`.toLowerCase().includes(query.toLowerCase().trim()) && (region === 'All' || c.region === region));
  const filtered = !query.trim() && region === 'All' ? countries.map(c => catalogue.find(item => item.code === c.code)).filter(Boolean) : matches;
  function open(c) { setQuickBuyCountry(c); }
  function goSearch() { search.current.focus(); search.current.scrollIntoView({ behavior: 'auto', block: 'center' }); }
  return <div className={`${s.root} ${motion.root}`} ref={root}>
    <a href="#content" className={s.skip}>Skip to content</a>
    <Header authenticated={authenticated} home onSearch={goSearch}/>
    <main id="content">
      <section className={s.hero} aria-labelledby="hero-title">
        <HeroWaves/>
        <div className={s.heroLayout}>
          <div className={s.heroCopy}>
            <div data-motion-reveal data-motion-delay="200" className={s.networkLabel}><i className={s.dot}/> GLOBAL eSIM NETWORK</div>
            <MotionHeading data-motion-delay="350" as="h1" id="hero-title">Stay<br/>Connected<br/><span style={{color:'#888984'}}>Further</span></MotionHeading>
            <p data-motion-delay="650" className={s.heroDescription}>Instant eSIM for 200+ countries.<br/>No borders. No extra fees. Just freedom.</p>
            
            <form data-motion-enter="scaleReveal" data-motion-delay="800" className={s.search} onSubmit={e => { e.preventDefault(); if (filtered.length === 1) open(filtered[0], { currentTarget: search.current }); else document.getElementById('destinations').scrollIntoView(); }}>
              <Search size={22}/><label className={s.srOnly} htmlFor="destination-search">Where are you going?</label>
              <input ref={search} id="destination-search" placeholder="Where are you going?" value={query} onChange={e => { setQuery(e.target.value); setRegion('All'); }}/>
              <button aria-label="Search destinations"><Arrow/></button>
            </form>
            <div className={s.heroBenefits}>{[[Zap, 'Instant activation'], [Signal, 'Reliable coverage'], [BatteryMedium, 'No physical SIM'], [Globe2, '200+ countries']].map(([Icon, text]) => <div key={text}><Icon size={21} strokeWidth={1.5}/><span>{text}</span></div>)}</div>
          </div>
          <div className={s.heroScene} ref={scene} data-motion-scene aria-label="MORROWGO app interface preview">
            <div className={s.apeArtwork} data-motion-visual="ape"><Image src="/brand/editorial-ape-right.png" alt="" width={1122} height={1402} sizes="(max-width: 360px) 170px, (max-width: 700px) 200px, 340px" priority/></div>
            <span className={s.sceneWords}>PEOPLE<br/>PLACES<br/>STORIES<br/>ALWAYS<br/>CONNECTED<span/></span>
            <button className={s.japanFloat} data-motion-visual="japan" onClick={e => open(countries[0], e)}>
              <span className={s.destinationArt} aria-hidden="true"><svg viewBox="0 0 240 170" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="fuji-sky" x2="0" y2="1"><stop stopColor="#afbdc4"/><stop offset="1" stopColor="#e0e0d5"/></linearGradient><linearGradient id="fuji-rock" x2=".7" y2="1"><stop stopColor="#cbd0cd"/><stop offset="1" stopColor="#465968"/></linearGradient></defs><path fill="url(#fuji-sky)" d="M0 0h240v170H0z"/><path fill="#a7b5b9" d="M0 138 54 108 77 121 121 93 173 119 200 104 240 129v41H0z"/><path fill="url(#fuji-rock)" d="m18 158 95-117 17-5 13 8 88 114z"/><path fill="#d8dedc" d="m84 78 29-37 17-5 13 8 26 36-22-13 3 15-20-27-5 23-6-20-16 28 5-23z"/><path stroke="#8d9ea4" strokeWidth="2" fill="none" d="m119 68-39 69m52-78 24 85m-34-59-7 59m38-53 31 58"/><path fill="#233b42" d="m0 138 19 5 18-12 21 9 23-9 25 19 29-11 26 12 31-12 48-13v44H0z"/><g fill="#172b2d"><path d="m203 83-8 19h5l-12 22h8l-16 25h20v21h5v-21h20l-17-25h9l-12-22h5z"/><path d="m227 101-8 18h5l-13 25h11v26h5v-26h13l-11-25h6z"/><path d="m23 121-12 27h8v22h6v-22h10z"/></g></svg></span>
              <span className={s.japanName}>Japan <span>🇯🇵</span></span><span className={s.japanPrice}>{catalogue.find(c => c.code === 'JP') ? `From ${money(catalogue.find(c => c.code === 'JP').fromPrice)}` : 'View plans'} <Arrow/></span>
            </button>
            <div className={s.editorialFloat} data-motion-visual="travel"><span>Travel<br/>Without<br/>Limits</span><div>MORROWGO <Arrow diagonal/></div></div>
            <button className={s.heroDeviceAsset} data-motion-visual="phone" onClick={e => open(countries[0], e)} aria-label="Open Japan eSIM plans">
              <Image src="/brand/hero-japan-phone.png" alt="MORROWGO Japan eSIM on a premium smartphone" width={1086} height={1448} sizes="(max-width: 700px) 58vw, 390px" priority/>
            </button>
            <div className={s.connectionNote} data-motion-visual="tomorrow">A<br/>BETTER<br/>TOMORROW<br/>CONNECTS<br/>PEOPLE<span/></div>
          </div>
        </div>
        <div className={s.demoNote}>Sandbox · Test purchases only. Phone imagery shows sample usage; test eSIMs cannot be installed.</div>
      </section>
      <section id="destinations" className={s.section} data-reveal aria-labelledby="dest-title">
        <div className={s.sectionTitle}><span data-motion-reveal className={s.index}>01 / EXPLORE</span><MotionHeading id="dest-title">Where to next?</MotionHeading><span className={s.secondary}>A small world.<br/>A lot to discover.</span></div>
        <div className={s.filters} aria-label="Filter destinations">{['All', 'Europe', 'Asia', 'Americas'].map(r => <button key={r} aria-pressed={region === r} onClick={() => setRegion(r)}>{r === 'All' ? 'Popular destinations' : r}</button>)}<span aria-live="polite">{filtered.length} destinations</span></div>
        <a className={s.accountLink} href="/destinations">View all destinations →</a><div className={s.destinationGrid}>{filtered.map(c => <button key={c.code} className={s.destination} data-motion-card onClick={e => open(c, e)}>
          <span className={s.destMeta}>{c.region}<span>{c.code}</span></span><span className={s.flag} data-motion-card-art aria-hidden="true">{c.flag}</span><span className={s.destName}>{c.name}</span><span className={s.destPrice}>From {money(c.fromPrice)} <Arrow diagonal/></span>
        </button>)}</div>
        {!filtered.length && <div className={s.empty}><p>{catalogueState === 'loading' ? 'Loading destinations…' : catalogueState === 'error' ? 'Destinations are temporarily unavailable. Please try again shortly.' : 'No matching destinations.'}</p><button onClick={() => { setQuery(''); setRegion('All'); }}>Show all destinations <Arrow/></button></div>}
      </section>
      <section id="how" className={`${s.section} ${s.how}`} data-reveal aria-labelledby="how-title"><div><span data-motion-reveal className={s.index}>02 / NO FRICTION</span><MotionHeading id="how-title">Three steps.<br/>Then you’re there.</MotionHeading></div><div className={s.steps}>{[['Choose your plan', 'Your destination. Your data.'], ['Pay securely', 'One clear total.'], ['Get connected', 'Install your eSIM and go.']].map(([title, text], i) => <div key={title} data-motion-step><span>0{i + 1}</span><h3>{title}</h3><p>{text}</p></div>)}</div></section>
      <section id="product" className={`${s.product} ${s.referenceNative}`} data-reveal aria-labelledby="product-title">
        <div className={s.productIntro}>
          <span data-motion-reveal className={s.index}>03</span><MotionHeading id="product-title">All your<br/>connections<br/>in one app.</MotionHeading>
          <p>Buy. Install. Manage. Anytime, anywhere.</p><div className={s.comingSoon}>COMING SOON</div>
          <div className={s.storeLabels} aria-label="Coming soon on App Store and Google Play"><span>App Store <small>Coming soon</small></span><span>Google Play <small>Coming soon</small></span></div>
        </div>
        <div className={s.adDeviceAsset} data-motion-visual="app" aria-hidden="true">
          <Image src="/brand/app-phone-closeup.png" alt="" width={1122} height={1402} sizes="(max-width: 700px) 72vw, 460px"/>
        </div>
        <div className={s.adFeatures} data-motion-support><div><Signal size={23}/><span>Track your data</span></div><button onClick={() => router.push('/account/esims')} aria-label="Top up"><Plus size={23}/><span>Top up anytime</span></button><div><Layers size={23}/><span>Manage multiple eSIMs</span></div><div><MessageSquare size={23}/><span>Get support 24/7<small>Planned app feature</small></span></div></div>
        <span className={s.adWords}>SAME<br/>WORLD<br/>MORE<br/>FREEDOM<i/></span>
      </section>
      <section className={s.finalCta}><span data-motion-reveal className={s.index}>READY WHEN YOU ARE</span><MotionHeading>Go further.<br/>Stay connected.</MotionHeading><button className={s.navCta} onClick={goSearch}>Find your eSIM <Arrow/></button><div className={s.trust}>{[[Globe2, '200+ countries'], [ShieldCheck, 'Secure payment'], [BatteryMedium, 'No physical SIM'], [Headphones, 'Support']].map(([Icon, text]) => <span key={text}><Icon size={18}/>{text}</span>)}</div></section>
    </main>
    <footer className={s.footer}><a href="/" className={s.wordmark}><Mark/>MORROWGO</a><span>More places. Brighter tomorrows.</span><span>© 2026 MORROWGO</span></footer>

    {quickBuyCountry && <QuickBuy key={quickBuyCountry.code} country={quickBuyCountry} onClose={() => setQuickBuyCountry(null)}/>}
  </div>;
}
