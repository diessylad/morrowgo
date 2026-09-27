'use client';
import { Text, Localized, useLanguage } from './../../../components/i18n/Provider';
import en from './../../../locales/en.json';

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
  const { language } = useLanguage();
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
            en["m_bc589416dd95"]
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
          en["m_d68b9b4619d0"]
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
      return en["m_b8bef37b7153"];
    }

    if (plan.dataMB && Number(plan.dataMB) < 1024) return `${plan.dataMB} MB`;
    if (plan.dataGB) return `${Number(Number(plan.dataGB).toFixed(2))} GB`;

    if (plan.dataMB) {
      return `${plan.dataMB} MB`;
    }

    return en["m_fa28de1bbbe3"];
  }

  function openCheckout(plan) { return startCheckout(iso, plan); }

  return <div ref={root} className={`${base.page} ${s.page} ${mobile.page} ${mobile.tariff} ${motion.root}`}><Header transparent/><TravelArtwork/><main className={s.wrap}>
    <div className={s.content}>
      <a className={s.back} href="/destinations"><ArrowLeft size={18}/><Text>{en["m_a693e8034f88"]}</Text></a>
      <div className={s.country}><span aria-hidden="true"><Text>{flag}</Text></span><label className={s.srOnly} htmlFor="destination-country"><Text>{en["m_d42713493ca8"]}</Text></label><select id="destination-country" value={iso} onChange={e=>router.push(`/destination/${encodeURIComponent(e.target.value)}`)}><Text>{!countries.some(c=>(c.iso||c.code)===iso)&&<option value={iso}><Text>{name}</Text></option>}{countries.map(c=><option key={c.iso||c.code} value={c.iso||c.code}><Text>{c.name}</Text></option>)}</Text></select><ChevronDown size={16}/></div>
      <MotionHeading as="h1" className={s.title}><Text>{en["m_925338de78ef"]}</Text><br/>{language === 'en' && en["m_c36551215cb2"]}<Text>{name}</Text>.</MotionHeading>
      <p className={s.description}><Text>{en["m_724ff295355d"]}</Text></p>
      <TravelArtwork mobile/><div className={s.benefits}><span><Zap/><Text>{en["m_e5dd7083ff5f"]}</Text><br/><Text>{en["m_6d183114493d"]}</Text></span><span><Signal/><Text>{en["m_72aee276200a"]}</Text><br/><Text>{en["m_6dafbcf610e9"]}</Text></span><span><Smartphone/><Text>{en["m_72a197566bea"]}</Text><br/><Text>{en["m_9563e7496df3"]}</Text></span><span><Globe2/>200+<br/><Text>{en["m_11ef521f7085"]}</Text></span></div>
      <Localized as="section" className={s.plans} aria-label={en["m_3b6748925900"]}>
        {loading ? <p className={s.empty} role="status"><Text>{en["m_fe14fe1126f8"]}</Text></p> : error ? <p className={s.empty} role="alert"><Text>{error}</Text></p> : <>
          <PlanCategory value={category} onChange={setCategory}/>
          <div className={s.cardList}>{displayedPlans.map(plan=><PlanCard key={plan.id} plan={plan} recommended={!plan.unlimited && (Number(plan.dataGB) === 5 || Number(plan.dataMB) === 5120)} formatData={formatData} onBuy={openCheckout} onSelect={plan=>setSelectedId(plan.id)} selected={plan.id===selectedPlan?.id} showSpeedDetails/>)}</div>
          <Text>{!displayedPlans.length && <p className={s.empty}><Text>{en["m_85cdebe11045"]}</Text><Text>{category === en["m_e1a6f0b6f73a"] ? en["m_e1a6f0b6f73a"] : en["m_45300a3b9412"]}</Text><Text>{en["m_00d769d8f7d5"]}</Text></p>}</Text>
        </>}
      </Localized>
    </div>
  </main><Text>{!loading && !error && selectedPlan && <PurchaseBar key={iso} plan={selectedPlan} country={name} formatData={formatData} onBuy={openCheckout}/>}</Text></div>;
}
