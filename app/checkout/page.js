'use client';

import Header from '../../components/customer/Header';
import s from '../../components/customer/customer.module.css';
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
        'Invalid eSIM plan.'
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
            'Could not load plan'
          );
        }

        const selected =
          data.packages.find(
            (item) =>
              item.id === planId
          );

        if (!selected) {
          throw new Error(
            'Plan not found'
          );
        }

        setPlan(selected);
      } catch {
        setError(
          'Selected eSIM plan could not be loaded.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
  }, [iso, planId]);

  function formatData(item) {
    if (item.unlimited) {
      return 'Unlimited';
    }

    if (item.dataGB) {
      return `${item.dataGB} GB`;
    }

    if (item.dataMB) {
      return `${item.dataMB} MB`;
    }

    return 'Data plan';
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
          'Could not start payment'
        );
      }

      window.location.href =
        data.url;
    } catch (paymentError) {
      setError(
        paymentError?.message ||
        'Could not start payment.'
      );

      setPaymentLoading(false);
    }
  }

  return <div className={s.page}><Header/><main className={s.wrap}><span className={s.label}>YOUR CONNECTION / CHECKOUT</span><h1 className={s.title}>{plan?.country || 'Your plan'}</h1><p className={s.intro}>One plan. One clear total.</p>{cancelled && <p className={s.notice}>Checkout was cancelled. You can review your plan and try again.</p>}{loading && <p role="status">Loading your plan…</p>}{error && <p role="alert">{error}</p>}{plan && <section className={s.card} style={{maxWidth:560}}><span className={s.label}>SANDBOX / TEST PURCHASE</span><h2>{formatData(plan)}</h2><p>{plan.duration} days · {plan.country}</p><p>{plan.operator}<br/>{plan.networks?.join(' / ')}</p><p>€{Number(plan.price).toFixed(2)} total</p><label style={{display:'flex',alignItems:'flex-start',gap:12,fontSize:14,lineHeight:1.7,margin:'20px 0'}}><input type="checkbox" checked={compatible} onChange={e=>setCompatible(e.target.checked)} style={{marginTop:5}}/>I have checked that my phone supports eSIM and is carrier-unlocked.</label><Link href="/compatibility" style={{color:'inherit',fontSize:13}}>Device compatibility ↗</Link><p>Sandbox eSIMs are for testing and cannot be installed. Payment is confirmed only by Stripe.</p><button className={s.button} onClick={continueToPayment} disabled={paymentLoading || !compatible}>{paymentLoading?'Opening Stripe…':`Continue — €${Number(plan.price).toFixed(2)}`}</button></section>}</main></div>;
}
