'use client';
import { Text, Localized, Message, useLanguage } from './../i18n/Provider';
import en from './../../locales/en.json';
import { CookieSettingsLink } from '../privacy/CookieConsent';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion as motionUI, useReducedMotion } from 'motion/react';
import { premiumTransition } from '../shared/MotionPrimitives';
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
import NetworkMarquee from '../networks/NetworkMarquee';
import DestinationLoading from '../loading/DestinationLoading';
import HeroEsimScene from './HeroEsimScene';

const countries = [
  { name: en["m_fcf29f6cad32"], flag: '🇯🇵', code: 'JP', region: en["m_a173e725607d"], city: 'Tokyo', zone: '35.67° N / 139.65° E' },
  { name: en["m_ad79ef0f076d"], flag: '🇮🇹', code: 'IT', region: en["m_576347ec826f"], city: 'Rome', zone: '41.90° N / 12.49° E' },
  { name: en["m_18bc5956dbf1"], flag: '🇺🇸', code: 'US', region: en["m_5e5e8878adfd"], city: 'New York', zone: '40.71° N / 74.00° W' },
  { name: en["m_a2b7c120c93a"], flag: '🇹🇭', code: 'TH', region: en["m_a173e725607d"], city: 'Bangkok', zone: '13.75° N / 100.50° E' },
  { name: en["m_e3772ac4b4db"], flag: '🇫🇷', code: 'FR', region: en["m_576347ec826f"], city: 'Paris', zone: '48.85° N / 2.35° E' },
  { name: en["m_20a8df9b7603"], flag: '🇪🇸', code: 'ES', region: en["m_576347ec826f"], city: 'Madrid', zone: '40.41° N / 3.70° W' }
];
const money = n => `€${n.toFixed(2)}`;
function Mark() { return <span className={s.mark} aria-hidden="true"><i/><i/><i/><i/></span>; }
function Arrow({ diagonal = false }) { return diagonal ? <ArrowUpRight size={19}/> : <ArrowRight size={19}/>; }

export default function Experience({ authenticated = false }) {
  const { t } = useLanguage();
  const reduced = useReducedMotion();
  const router = useRouter();
  const [catalogue, setCatalogue] = useState([]);
  const [catalogueState, setCatalogueState] = useState('loading');
  useEffect(() => { let active = true; fetch('/api/catalogue/countries').then(r => { if (!r.ok) throw new Error(); return r.json(); }).then(d => { if(active){setCatalogue(d.countries);setCatalogueState('ready');} }).catch(() => {if(active)setCatalogueState('error');}); return () => {active=false;}; }, []);
  const [quickBuyCountry, setQuickBuyCountry] = useState(null);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [region, setRegion] = useState(en["m_6a72085653e4"]);
  const scene = useRef(null);
  const root = useRef(null);
  usePremiumMotion(root);
  const search = useRef(null);
  const matches = catalogue.filter(c => `${c.name} ${t(c.name)} ${c.region} ${t(c.region)} ${c.code}`.toLowerCase().includes(query.toLowerCase().trim()) && (region === en["m_6a72085653e4"] || c.region === region));
  const filtered = !query.trim() && region === en["m_6a72085653e4"] ? countries.map(c => catalogue.find(item => item.code === c.code)).filter(Boolean) : matches;
  function open(c) { setSearchOpen(false); setQuickBuyCountry(c); }
  function goSearch() { search.current.focus(); search.current.scrollIntoView({ behavior: 'auto', block: 'center' }); }
  return <div className={`${s.root} ${motion.root}`} ref={root}>
    <a href="#content" className={s.skip}><Text>{en["m_0a4470d64e9d"]}</Text></a>
    <Header authenticated={authenticated} home onSearch={goSearch}/>
    <main id="content">
      <section className={s.hero} aria-labelledby="hero-title">
        <HeroWaves atmosphereSrc="/brand/hero-mountains-only.png" waves/>
        <div className={s.heroLayout}>
          <div className={s.heroCopy}>
            <div data-motion-reveal data-motion-delay="200" className={s.networkLabel}><i className={s.dot}/><Text>{en["m_17a0c31f2ced"]}</Text></div>
            <MotionHeading data-motion-delay="350" as="h1" id="hero-title"><Text>{en["m_ae768f766f75"]}</Text><br/><Text>{en["m_c2f9b7b4897f"]}</Text><br/><span style={{color:'#888984'}}><Text>{en["m_0d20ee8c0672"]}</Text></span></MotionHeading>
            <p data-motion-delay="650" className={s.heroDescription}><Text>{en["m_92a0d9f0f039"]}</Text><br/><Text>Choose your destination. Find your data plan.</Text></p>
            
            <div className={s.searchArea} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false); }} onKeyDown={event => { if (event.key === "Escape") { setSearchOpen(false); search.current?.focus(); } }}>
            <form data-motion-enter="scaleReveal" data-motion-delay="800" className={s.search} onSubmit={e => { e.preventDefault(); if (filtered.length === 1) open(filtered[0], { currentTarget: search.current }); else document.getElementById(en["m_773a3b986de1"]).scrollIntoView(); }}>
              <Search size={22}/><label className={s.srOnly} htmlFor="destination-search"><Text>{en["m_4a587acda027"]}</Text></label>
              <Localized as="input" ref={search} id="destination-search" placeholder={en["m_4a587acda027"]} enterKeyHint="search" autoComplete="off" value={query} aria-controls={searchOpen && query.trim() ? "country-suggestions" : undefined} onFocus={() => setSearchOpen(true)} onChange={e => { setSearchOpen(true); setQuery(e.target.value); setRegion(en["m_6a72085653e4"]); }}/>
              <motionUI.button type="submit" aria-label={t(en["m_86cdde82421b"])} whileTap={reduced ? undefined : {scale:.97}} transition={premiumTransition}><span className={s.searchButtonLabel}><Text>Find plans</Text></span><Arrow/></motionUI.button>
            </form>
            <AnimatePresence initial={false}>
            {searchOpen && query.trim() && catalogueState === 'ready' && <motionUI.ul key="suggestions" id="country-suggestions" className={s.suggestions} aria-label={t(en["m_86cdde82421b"])} initial={{opacity:0,y:reduced?0:-4}} animate={{opacity:1,y:0}} exit={{opacity:0}} transition={{...premiumTransition,duration:reduced?0:.18}}>
              {matches.slice(0, 5).map(country => <li key={country.code}><button type="button" onClick={() => open(country)}><span aria-hidden="true">{country.flag}</span><span className={s.suggestionName}><Text>{country.name}</Text></span><small><Text>{`From ${money(country.fromPrice)}`}</Text></small><Arrow/></button></li>)}
              {!matches.length && <li className={s.searchEmpty} role="status"><Text>No matching destination. Try another country.</Text></li>}
            </motionUI.ul>}
            </AnimatePresence>
            <div className={s.quickDestinations} aria-label={t('Popular destinations')}><span><Text>Popular:</Text></span>{countries.slice(0,3).map(country => <button type="button" key={country.code} onClick={() => open(catalogue.find(item => item.code === country.code) || country)}><Text>{country.name}</Text><ArrowUpRight size={12} aria-hidden="true"/></button>)}</div>
            </div>
            <div className={s.heroBenefits}><Text>{[[Zap, en["m_de9526786967"]], [Signal, en["m_6c11f7011123"]], [BatteryMedium, en["m_111e8a76aed3"]], [Globe2, en["m_bd382f1e76a8"]]].map(([Icon, text]) => <div key={text}><Icon size={21} strokeWidth={1.5}/><span><Text>{text}</Text></span></div>)}</Text></div>
          </div>
          <Localized as="div" className={s.heroScene} ref={scene} data-motion-scene aria-label={en["m_0121ccffb836"]}>
            <HeroEsimScene/>
            <span className={s.sceneWords}><Text>{en["m_04c1b69737f5"]}</Text><br/><Text>{en["m_3cc3cf635b90"]}</Text><br/><Text>{en["m_b15ee3c4e6d8"]}</Text><br/><Text>{en["m_ae0ecf3287db"]}</Text><br/><Text>{en["m_073afc98bdd0"]}</Text><span/></span>
          </Localized>
        </div>
        <div className={s.demoNote}><Text>{en["m_d6043156b938"]}</Text></div>
      </section>
      <section id="destinations" className={s.section} data-reveal aria-labelledby="dest-title">
        <div className={s.sectionTitle}><span data-motion-reveal className={s.index}><Text>{en["m_77c987c49939"]}</Text></span><MotionHeading id="dest-title"><Text>{en["m_114667b0693a"]}</Text></MotionHeading><span className={s.secondary}><Text>{en["m_66819ed7d0da"]}</Text><br/><Text>{en["m_c62800750552"]}</Text></span></div>
        <Localized as="div" className={s.filters} aria-label={en["m_b0dec7ce02ac"]}><Text>{[en["m_6a72085653e4"], en["m_576347ec826f"], en["m_a173e725607d"], en["m_5e5e8878adfd"]].map(r => <button key={r} aria-pressed={region === r} onClick={() => setRegion(r)}><Text>{r === en["m_6a72085653e4"] ? en["m_f7363a51c52a"] : r}</Text></button>)}</Text>{catalogueState === 'ready' && <span aria-live="polite"><Text>{filtered.length}</Text><Text>{en["m_95dd6273d716"]}</Text></span>}</Localized>
        <a className={s.accountLink} href="/destinations?returnTo=%2F"><Text>{en["m_efcb9da192e3"]}</Text></a><DestinationLoading loading={catalogueState === 'loading'} error={catalogueState === 'error'}><div className={s.destinationGrid}><Text>{filtered.map(c => <button key={c.code} className={s.destination} data-motion-card onClick={e => open(c, e)}>
          <span className={s.destMeta}><Text>{c.region}</Text><span><Text>{c.code}</Text></span></span><span className={s.flag} data-motion-card-art aria-hidden="true"><Text>{c.flag}</Text></span><span className={s.destName}><Text>{c.name}</Text></span><span className={s.destPrice}><Text>{en["m_6e9b4e1652f2"]}</Text><Text>{money(c.fromPrice)}</Text> <Arrow diagonal/></span>
        </button>)}</Text></div>
        <Text>{!filtered.length && <div className={s.empty}><p><Text>{catalogueState === 'error' ? en["m_1d0480bb6541"] : en["m_ce3be38426bb"]}</Text></p><button onClick={() => { setQuery(''); setRegion(en["m_6a72085653e4"]); }}><Text>{en["m_0d2dfad3e330"]}</Text><Arrow/></button></div>}</Text>
        </DestinationLoading>
      </section>
      <section id="how" className={`${s.section} ${s.how}`} data-reveal aria-labelledby="how-title"><div><span data-motion-reveal className={s.index}><Text>{en["m_23fc41fe75a6"]}</Text></span><MotionHeading id="how-title"><Text>{en["m_87f42baeb107"]}</Text><br/><Text>{en["m_95a9f96a1ee8"]}</Text></MotionHeading></div><div className={s.steps}><Text>{[[en["m_12a7bc47d455"], en["m_f429ca1e486b"]], [en["m_403d983022fc"], en["m_74a9a03fe632"]], [en["m_2cf20e861287"], en["m_6e00a621afe6"]]].map(([title, text], i) => <div key={title} data-motion-step><span>0<Text>{i + 1}</Text></span><h3><Text>{title}</Text></h3><p><Text>{text}</Text></p></div>)}</Text></div></section>
      <section id="product" className={`${s.product} ${s.referenceNative}`} data-reveal aria-labelledby="product-title">
        <div className={s.productIntro}>
          <span data-motion-reveal className={s.index}>03</span><MotionHeading id="product-title"><Text>{en["m_46ce5c7d2f1f"]}</Text><br/><Text>{en["m_c0e3cefcb038"]}</Text><br/><Text>{en["m_91d3a83e3655"]}</Text></MotionHeading>
          <p><Text>{en["m_da9f4d83aa7a"]}</Text></p><div className={s.comingSoon}><Text>{en["m_4e5f0991ea26"]}</Text></div>
          <Localized as="div" className={s.storeLabels} aria-label={en["m_1fea3b320545"]}><span><Text>{en["m_db898acb204b"]}</Text><small><Text>{en["m_e4115be258db"]}</Text></small></span><span><Text>{en["m_1271e4ed6cba"]}</Text><small><Text>{en["m_e4115be258db"]}</Text></small></span></Localized>
        </div>
        <div className={s.adDeviceAsset} data-motion-visual="app" aria-hidden="true">
          <Image src="/brand/app-phone-closeup.png" alt="" width={1122} height={1402} sizes="(max-width: 700px) 72vw, 460px"/>
        </div>
        <div className={s.adFeatures} data-motion-support><div><Signal size={23}/><span><Text>{en["m_7bfd923aacea"]}</Text></span></div><Localized as="button" onClick={() => router.push('/account/esims')} aria-label={en["m_91d42a8b742a"]}><Plus size={23}/><span><Text>{en["m_3ad6265617bd"]}</Text></span></Localized><div><Layers size={23}/><span><Text>{en["m_e03900cab718"]}</Text></span></div><div><MessageSquare size={23}/><span><Text>{en["m_6e0e115b6106"]}</Text><small><Text>{en["m_ecb13b6fd14e"]}</Text></small></span></div></div>
        <span className={s.adWords}><Text>{en["m_64b404a01e9e"]}</Text><br/><Text>{en["m_1a5db926797b"]}</Text><br/><Text>{en["m_2c624e5265a0"]}</Text><br/><Text>{en["m_d1f0217ef2bc"]}</Text><i/></span>
      </section>
      <section className={s.finalCta}><span data-motion-reveal className={s.index}><Text>{en["m_31ef5478769c"]}</Text></span><MotionHeading><Text>{en["m_8d076269bfc2"]}</Text><br/><Text>{en["m_14a5d64616de"]}</Text></MotionHeading><button className={s.navCta} onClick={goSearch}><Text>{en["m_f469df981f57"]}</Text><Arrow/></button><div className={s.trust}><Text>{[[Globe2, en["m_bd382f1e76a8"]], [ShieldCheck, en["m_131264f5cd8b"]], [BatteryMedium, en["m_111e8a76aed3"]], [Headphones, en["m_f32d5a3b17e6"]]].map(([Icon, text]) => <span key={text}><Icon size={18}/><Text>{text}</Text></span>)}</Text></div></section>
    </main>
    <NetworkMarquee/>
    <footer className={s.footer}><a href="/" className={s.wordmark}><Mark/><Text>{en["m_eef9e6b1a9f1"]}</Text></a><span><Text>{en["m_dd9a5f5e172d"]}</Text></span><CookieSettingsLink/></footer>

    <Text>{quickBuyCountry && <QuickBuy key={quickBuyCountry.code} country={quickBuyCountry} onClose={() => setQuickBuyCountry(null)}/>}</Text>
  </div>;
}
