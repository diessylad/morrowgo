'use client';

import { startCheckout } from '../../../components/purchase/startCheckout';

import { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, ChevronDown, Globe2, Zap, Signal, Smartphone
} from 'lucide-react';

import Header from '../../../components/shared/Header';
import base from '../../../components/customer/customer.module.css';
import s from './destination.module.css';
import PlanCard from '../../../components/destination/PlanCard';
import PurchaseBar from '../../../components/purchase/PurchaseBar';
import PlanCategory from '../../../components/destination/PlanCategory';
import { selectPlans } from '../../../components/quick-buy/selectPlans.mjs';
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

  const [category, setCategory] = useState('fixed');
  const displayedPlans = useMemo(() => selectPlans(packages, category), [packages, category]);
  const [selectedId, setSelectedId] = useState(null);
  const selectedPlan = displayedPlans.find(plan => plan.id === selectedId) || displayedPlans[0];
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

  function openCheckout(plan) { return startCheckout(iso, plan); }

  return <div ref={root} className={`${base.page} ${s.page} ${mobile.page} ${mobile.tariff} ${motion.root}`}><Header transparent/><TravelArtwork/><main className={s.wrap}>
    <div className={s.content}>
      <a className={s.back} href="/destinations"><ArrowLeft size={18}/>All destinations</a>
      <div className={s.country}><span aria-hidden="true">{flag}</span><label className={s.srOnly} htmlFor="destination-country">Destination</label><select id="destination-country" value={iso} onChange={e=>router.push(`/destination/${encodeURIComponent(e.target.value)}`)}>{!countries.some(c=>(c.iso||c.code)===iso)&&<option value={iso}>{name}</option>}{countries.map(c=><option key={c.iso||c.code} value={c.iso||c.code}>{c.name}</option>)}</select><ChevronDown size={16}/></div>
      <MotionHeading as="h1" className={s.title}>Stay connected<br/>in {name}.</MotionHeading>
      <p className={s.description}>Instant eSIM. Reliable coverage. No extra fees.</p>
      <TravelArtwork mobile/><div className={s.benefits}><span><Zap/>Instant<br/>activation</span><span><Signal/>Reliable<br/>coverage</span><span><Smartphone/>No physical<br/>SIM</span><span><Globe2/>200+<br/>countries</span></div>
      <section className={s.plans} aria-label="Available eSIM plans">
        {loading ? <p className={s.empty} role="status">Loading plans…</p> : error ? <p className={s.empty} role="alert">{error}</p> : <>
          <PlanCategory value={category} onChange={setCategory}/>
          <div className={s.cardList}>{displayedPlans.map(plan=><PlanCard key={plan.id} plan={plan} recommended={!plan.unlimited && (Number(plan.dataGB) === 5 || Number(plan.dataMB) === 5120)} formatData={formatData} onBuy={openCheckout} onSelect={plan=>setSelectedId(plan.id)} selected={plan.id===selectedPlan?.id} showSpeedDetails/>)}</div>
          {!displayedPlans.length && <p className={s.empty}>No {category === 'unlimited' ? 'unlimited' : 'fixed-data'} plans are currently available for this destination.</p>}
        </>}
      </section>
    </div>
  </main>{!loading && !error && selectedPlan && <PurchaseBar key={iso} plan={selectedPlan} country={name} formatData={formatData} onBuy={openCheckout}/>}</div>;
}
