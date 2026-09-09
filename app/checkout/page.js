'use client';

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
            `/api/esimgo/catalogue?country=${iso}`
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

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#080808',
        color: '#f5f5f5',
        padding:
          '28px 18px 70px'
      }}
    >
      <div
        style={{
          maxWidth: '760px',
          margin: '0 auto'
        }}
      >
        <button
          onClick={() =>
            router.back()
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border:
              '1px solid #333',
            background: '#111',
            color: '#fff',
            borderRadius:
              '30px',
            padding:
              '10px 16px',
            cursor: 'pointer'
          }}
        >
          <ArrowLeft size={17} />
          Back
        </button>

        <div
          style={{
            marginTop: '42px'
          }}
        >
          <div
            style={{
              fontSize: '12px',
              letterSpacing: '2px',
              color: '#888'
            }}
          >
            MORROWGO CHECKOUT
          </div>

          <h1
            style={{
              fontSize:
                'clamp(38px, 7vw, 60px)',
              fontWeight: '500',
              marginBottom:
                '10px'
            }}
          >
            Your eSIM
          </h1>

          <p
            style={{
              color: '#999'
            }}
          >
            Review your plan
            before payment.
          </p>
        </div>

        {cancelled && <p role="status" style={{color:'#dddddd',lineHeight:1.7}}>Checkout was cancelled. Your plan is still here; you can review it before trying again.</p>}
        <p style={{fontSize:13,lineHeight:1.8,color:'#bbbbbb'}}>Pre-launch preview: eSIM delivery is not enabled. <Link href="/help" style={{color:'#eeeeee'}}>Help & FAQ</Link></p>
        {loading && (
          <p
            style={{
              marginTop: '40px',
              color: '#999'
            }}
          >
            Loading your plan...
          </p>
        )}

        {error && (
          <p
            style={{
              marginTop: '40px',
              color: '#ffb4b4'
            }}
          >
            {error}
          </p>
        )}

        {plan && (
          <div
            className="checkoutCard"
            style={{
              marginTop: '32px',
              border:
                '1px solid #2d2d2d',
              background:
                '#101010',
              borderRadius:
                '24px',
              padding: '26px'
            }}
          >
            <Wifi size={25} />

            <div
              style={{
                marginTop: '24px',
                color: '#999',
                fontSize: '14px'
              }}
            >
              {plan.country}
            </div>

            <div
              style={{
                marginTop: '5px',
                fontSize: '34px',
                fontWeight: '600'
              }}
            >
              {formatData(plan)}
            </div>

            <div
              style={{
                marginTop: '8px',
                color: '#aaa'
              }}
            >
              Valid for{' '}
              {plan.duration}{' '}
              {plan.duration === 1
                ? 'day'
                : 'days'}
            </div>

            <div
              style={{
                borderTop:
                  '1px solid #2d2d2d',
                marginTop: '28px',
                paddingTop: '24px',
                display: 'flex',
                justifyContent:
                  'space-between',
                alignItems:
                  'center'
              }}
            >
              <span
                style={{
                  color: '#aaa'
                }}
              >
                Total
              </span>

              <strong
                style={{
                  fontSize: '28px'
                }}
              >
                $
                {Number(
                  plan.price
                ).toFixed(2)}{' USD'}
              </strong>
            </div>

            <div style={{marginTop:24,fontSize:13,lineHeight:1.8,color:"#bbbbbb"}}><Link href="/compatibility" style={{color:"#eeeeee"}}>Check device compatibility →</Link><label style={{display:"flex",alignItems:"flex-start",gap:10,marginTop:14}}><input type="checkbox" checked={compatible} onChange={e => setCompatible(e.target.checked)} style={{marginTop:5,width:18,height:18,flexShrink:0}} />I have checked that my phone supports eSIM and is carrier-unlocked.</label><p>Plan activation, network and hotspot conditions must be confirmed before live sales begin.</p></div>
            <button
              onClick={
                continueToPayment
              }
              disabled={
                paymentLoading || !compatible
              }
              style={{
                width: '100%',
                marginTop: '26px',
                border: 0,
                borderRadius:
                  '30px',
                padding: '16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor:
                  paymentLoading
                    ? 'wait'
                    : compatible ? 'pointer' : 'not-allowed',
                opacity:
                  paymentLoading || !compatible
                    ? 0.7
                    : 1,
                display: 'flex',
                justifyContent:
                  'center',
                alignItems:
                  'center',
                gap: '10px'
              }}
            >
              {paymentLoading
                ? 'Opening Stripe...'
                : 'Continue to payment'}

              {!paymentLoading && (
                <ArrowRight
                  size={18}
                />
              )}
            </button>

            <div
              style={{
                marginTop: '18px',
                color: '#888',
                display: 'flex',
                justifyContent:
                  'center',
                alignItems:
                  'center',
                gap: '7px',
                fontSize: '13px'
              }}
            >
              <ShieldCheck
                size={15}
              />

              Secure checkout
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
