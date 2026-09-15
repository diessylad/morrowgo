'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Wifi
} from 'lucide-react';

import Header from '../../../components/customer/Header';
import s from '../../../components/customer/customer.module.css';

export default function DestinationPage() {
  const params = useParams();
  const router = useRouter();

  const iso = String(
    params.iso || ''
  ).toUpperCase();

  const [minimumDays, setMinimumDays] = useState(0);
  const [sort, setSort] = useState('price');
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

  const visiblePlans = useMemo(() => packages.filter(p => Number(p.duration) >= minimumDays).sort((a,b) => sort === 'duration' ? Number(a.duration)-Number(b.duration) : Number(a.price)-Number(b.price)), [packages,minimumDays,sort]);

  function formatData(plan) {
    if (plan.unlimited) {
      return 'Unlimited';
    }

    if (plan.dataGB) {
      return `${plan.dataGB} GB`;
    }

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

  return <div className={s.page}><Header/><main className={s.wrap}><span className={s.label}>MORROWGO eSIM / {iso}</span><h1 className={s.title}>{countryName || iso}</h1><p className={s.intro}>Choose your data plan.</p><div className={s.filters}><label>Validity<select value={minimumDays} onChange={e=>setMinimumDays(Number(e.target.value))}><option value={0}>Any duration</option><option value={7}>7+ days</option><option value={14}>14+ days</option><option value={30}>30+ days</option></select></label><label>Sort<select value={sort} onChange={e=>setSort(e.target.value)}><option value="price">Lowest price</option><option value="duration">Shortest validity</option></select></label><a href="/compatibility">Device compatibility ↗</a></div><p className={s.notice}>Sandbox · test eSIMs cannot be installed. Prices in EUR.</p>{loading ? <p role="status">Loading plans…</p> : error ? <p role="alert">{error}</p> : <><div className={s.grid}>{visiblePlans.map(plan=><article key={plan.id} className={s.card}><span className={s.label}>{plan.packageType === 'data' ? 'DATA ONLY' : 'DATA + CALLS + TEXTS'}</span><h2>{formatData(plan)}</h2><p>{plan.duration} days</p><p>{plan.operator}<br/>{plan.networks?.join(' / ')}</p><p>{plan.topupAvailable?'Top-ups subject to eSIM compatibility':'Top-ups not advertised'}{plan.fairUsage && <><br/>{plan.fairUsage}</>}</p><footer><strong>€{Number(plan.price).toFixed(2)}</strong><button className={s.select} aria-label={`Choose ${formatData(plan)} for ${plan.duration} days`} onClick={()=>openCheckout(plan)}>Select <ArrowRight size={19}/></button></footer></article>)}</div>{!visiblePlans.length&&<p>No plans match this duration. Try a shorter validity.</p>}</>}</main></div>;
}
