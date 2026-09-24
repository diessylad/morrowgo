'use client';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowRight, ArrowLeft, ChevronDown, Globe2, Zap, Signal, Smartphone, Info
} from 'lucide-react';

import Header from '../../../components/shared/Header';
import base from '../../../components/customer/customer.module.css';
import s from './destination.module.css';
import PlanCard from '../../../components/destination/PlanCard';
import mobile from '../../../components/shared/mobile.module.css';
import TravelArtwork from '../../../components/destination/TravelArtwork';
import usePremiumMotion from '../../../components/shared/usePremiumMotion';
import motion from '../../../components/shared/motion.module.css';
import MotionHeading from '../../../components/shared/MotionHeading';

export default function DestinationPage() {
  const root = useRef(null);
  usePremiumMotion(root);
  const params = useParams();
  const router = useRouter();

  const iso = String(
    params.iso || ''
  ).toUpperCase();

  const [countries, setCountries] = useState([]);
  useEffect(() => { fetch('/api/catalogue/countries').then(r=>r.json()).then(d=>{if(d.ok && Array.isArray(d.countries))setCountries(d.countries);}).catch(()=>{}); }, []);
  const [packages, setPackages] =
    useState([]);

  const [countryName, setCountryName] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    async function loadPackages() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          `/api/catalogue?country=${iso}`
        );

        const data =
          await response.json();

        if (
          !data.ok ||
          !Array.isArray(
            data.packages
          )
        ) {
          throw new Error(
            'Could not load plans'
          );
        }

        setPackages(
          data.packages
        );

        if (
          data.packages.length > 0
        ) {
          setCountryName(
            data.packages[0]
              .country || iso
          );
        } else {
          setCountryName(iso);
        }
      } catch {
        setError(
          'Could not load eSIM plans.'
        );
      } finally {
        setLoading(false);
      }
    }

    if (iso) {
      loadPackages();
    }
  }, [iso]);

  const displayedPlans = useMemo(() => {
    const remaining = [...new Map(packages.map(p => [p.id, p])).values()];
    const amount = p => Number(p.dataGB) || Number(p.dataMB) / 1024 || 0;
    const selected = [];
    for (const target of [1, 3, 5, 10, 20]) {
      const unlimited = target === 20 && remaining.some(p => p.unlimited);
      const candidates = remaining.filter(p => unlimited ? p.unlimited : !p.unlimited);
      candidates.sort((a,b) => (unlimited ? 0 : Math.abs(amount(a)-target)-Math.abs(amount(b)-target)) || Number(a.price)-Number(b.price) || Number(b.duration)-Number(a.duration) || String(a.id).localeCompare(String(b.id)));
      const plan = candidates[0] || remaining[0];
      if (plan) { selected.push(plan); remaining.splice(remaining.indexOf(plan), 1); }
    }
    return selected;
  }, [packages]);
  const flag = /^[A-Z]{2}$/.test(iso) ? String.fromCodePoint(...[...iso].map(c => c.charCodeAt(0) + 127397)) : '';
  const name = countryName || iso;

  function formatData(plan) {
    if (plan.unlimited) {
      return 'Unlimited';
    }

    if (plan.dataMB && Number(plan.dataMB) < 1024) return `${plan.dataMB} MB`;
    if (plan.dataGB) return `${Number(Number(plan.dataGB).toFixed(2))} GB`;

    if (plan.dataMB) {
      return `${plan.dataMB} MB`;
    }

    return 'Data plan';
  }

  function openCheckout(plan) {
    router.push(
      `/checkout?iso=${encodeURIComponent(
        iso
      )}&plan=${encodeURIComponent(
        plan.id
      )}`
    );
  }

  return <div ref={root} className={`${base.page} ${s.page} ${mobile.page} ${mobile.tariff} ${motion.root}`}><Header transparent/><TravelArtwork/><main className={s.wrap}>
    <div className={s.content}>
      <a className={s.back} href="/destinations"><ArrowLeft size={18}/>All destinations</a>
      <div className={s.country}><span aria-hidden="true">{flag}</span><label className={s.srOnly} htmlFor="destination-country">Destination</label><select id="destination-country" value={iso} onChange={e=>router.push(`/destination/${encodeURIComponent(e.target.value)}`)}>{!countries.some(c=>(c.iso||c.code)===iso)&&<option value={iso}>{name}</option>}{countries.map(c=><option key={c.iso||c.code} value={c.iso||c.code}>{c.name}</option>)}</select><ChevronDown size={16}/></div>
      <MotionHeading as="h1" className={s.title}>Stay connected<br/>in {name}.</MotionHeading>
      <p className={s.description}>Instant eSIM. Reliable coverage. No extra fees.</p>
      <TravelArtwork mobile/><div className={s.benefits}><span><Zap/>Instant<br/>activation</span><span><Signal/>Reliable<br/>coverage</span><span><Smartphone/>No physical<br/>SIM</span><span><Globe2/>200+<br/>countries</span></div>
      <section className={s.plans} aria-label="Available eSIM plans">
        {loading ? <p className={s.empty} role="status">Loading plans…</p> : error ? <p className={s.empty} role="alert">{error}</p> : <>
          <div className={s.cardList}>{displayedPlans.map(plan=><PlanCard key={plan.id} plan={plan} recommended={!plan.unlimited && (Number(plan.dataGB) === 5 || Number(plan.dataMB) === 5120)} formatData={formatData} onBuy={openCheckout}/>)}</div>
          {!displayedPlans.length && <p className={s.empty}>No plans are currently available for this destination.</p>}
        </>}
      </section>
      <div className={s.compatibility}><Info size={19}/><div><span>Top-ups subject to eSIM compatibility.</span> <a href="/compatibility">Check device compatibility <ArrowRight size={16}/></a></div></div>
      <p className={`${s.notice} ${process.env.NODE_ENV === 'production' ? mobile.productionNotice : ''}`}>Sandbox · test eSIMs cannot be installed. Prices as listed.</p>
    </div>
  </main></div>;
}
