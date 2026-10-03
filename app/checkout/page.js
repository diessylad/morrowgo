'use client';
import { Text } from './../../components/i18n/Provider';
import en from './../../locales/en.json';

import Header from '../../components/customer/Header';
import s from '../../components/customer/customer.module.css';

import CheckoutView from './CheckoutView';

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

  return <CheckoutView plan={plan} iso={iso} compatible={compatible} setCompatible={setCompatible} cancelled={cancelled} loading={loading} paymentLoading={paymentLoading} error={error} formatData={formatData} continueToPayment={continueToPayment}/>;
}
