'use client';
import { Text } from './../../components/i18n/Provider';
import en from './../../locales/en.json';

import Header from '../../components/customer/Header';
import s from '../../components/customer/customer.module.css';
import checkout from './checkout.module.css';
import { countryFlag } from '../../lib/account/presentation.mjs';
import {
  useEffect,
  useState
} from 'react';

import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Wifi
} from 'lucide-react';

import Link from 'next/link';

import {
  useRouter
} from 'next/navigation';

export default function CheckoutPage() {
  const router = useRouter();

  const [compatible, setCompatible] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [iso, setIso] =
    useState('');

  const [planId, setPlanId] =
    useState('');

  const [plan, setPlan] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [paymentLoading, setPaymentLoading] =
    useState(false);

  const [error, setError] =
    useState('');

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    setCancelled(params.get('canceled') === 'true');
    const country =
      (
        params.get('iso') || ''
      ).toUpperCase();

    const selectedPlan =
      params.get('plan') || '';

    setIso(country);
    setPlanId(selectedPlan);

    if (!country || !selectedPlan) {
      setError(
        en["m_c11baed9394f"]
      );

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!iso || !planId) {
      return;
    }

    async function loadPlan() {
      try {
        setLoading(true);
        setError('');

        const response =
          await fetch(
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
            en["m_5c169519af01"]
          );
        }

        const selected =
          data.packages.find(
            (item) =>
              item.id === planId
          );

        if (!selected) {
          throw new Error(
            en["m_08a032b50378"]
          );
        }

        setPlan(selected);
      } catch {
        setError(
          en["m_31254dca653c"]
        );
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
  }, [iso, planId]);

  function formatData(item) {
    if (item.unlimited) {
      return en["m_b8bef37b7153"];
    }

    if (item.dataGB) {
      return `${item.dataGB} GB`;
    }

    if (item.dataMB) {
      return `${item.dataMB} MB`;
    }

    return en["m_fa28de1bbbe3"];
  }

  async function continueToPayment() {
    if (!iso || !planId || !plan || !compatible) {
      return;
    }

    try {
      setPaymentLoading(true);
      setError('');

      const response =
        await fetch(
          '/api/stripe/checkout',
          {
            method: 'POST',

            headers: {
              'Content-Type':
                'application/json'
            },

            body:
              JSON.stringify({
                iso,
                plan: planId
              })
          }
        );

      if (response.status === 401) {
        window.location.assign(`/login?next=${encodeURIComponent(`/checkout?${new URLSearchParams({iso, plan: planId})}`)}`);
        return;
      }
      const data =
        await response.json();

      if (
        !response.ok ||
        !data?.ok ||
        !data?.url
      ) {
        throw new Error(
          data?.stripeError ||
          data?.error ||
          en["m_9dcd1d7581bc"]
        );
      }

      window.location.href =
        data.url;
    } catch (paymentError) {
      setError(
        paymentError?.message ||
        en["m_342e001c48bd"]
      );

      setPaymentLoading(false);
    }
  }

  return <div className={s.page}><Header/><main className={`${s.wrap} ${checkout.content}`}><span className={s.label}><Text>{en["m_84315e853c24"]}</Text></span><h1 className={`${s.title} ${checkout.heading}`}>{plan && /^[A-Z]{2}$/.test(iso) && <span className={checkout.flag} aria-hidden="true">{countryFlag(iso)}</span>}<Text>{plan?.country || en["m_b96ddaab20ff"]}</Text></h1><p className={s.intro}><Text>{en["m_7b95ac1b9268"]}</Text></p><Text>{cancelled && <p className={s.notice}><Text>{en["m_fc047e947793"]}</Text></p>}{loading && <p role="status"><Text>{en["m_8382938cd1cd"]}</Text></p>}{error && <p role="alert"><Text>{error}</Text></p>}</Text>{plan && <section className={s.card} style={{maxWidth:560}}><span className={s.label}><Text>{en["m_8b5bd1d3e985"]}</Text></span><h2><Text>{formatData(plan)}</Text></h2><p><Text>{plan.duration}</Text><Text>{en["m_6deff958bc5e"]}</Text><Text>{plan.country}</Text></p><p>{plan.operator}<br/>{plan.networks?.join(' / ')}</p><p>€<Text>{Number(plan.price).toFixed(2)}</Text><Text>{en["m_9ac1f4b1eb52"]}</Text></p><label style={{display:'flex',alignItems:'flex-start',gap:12,fontSize:14,lineHeight:1.7,margin:'20px 0'}}><input type="checkbox" checked={compatible} onChange={e=>setCompatible(e.target.checked)} style={{marginTop:5}}/><Text>{en["m_5e24d317fbba"]}</Text></label><Link href="/compatibility" style={{color:'inherit',fontSize:13}}><Text>{en["m_6c5503aa1111"]}</Text></Link><p><Text>{en["m_140631c26af0"]}</Text></p><button className={s.button} onClick={continueToPayment} disabled={paymentLoading || !compatible}><Text>{paymentLoading?en["m_8ed3c2197f2d"]:`Continue — €${Number(plan.price).toFixed(2)}`}</Text></button></section>}</main></div>;
}
