'use client';

import {
  useEffect,
  useState
} from 'react';

import {
  CheckCircle,
  Clock3,
  AlertCircle,
  ArrowRight
} from 'lucide-react';

import {
  useRouter
} from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();

  const [status, setStatus] =
    useState('loading');

  const [order, setOrder] =
    useState(null);

  const [error, setError] =
    useState('');

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const sessionId =
      params.get(
        'session_id'
      );

    if (!sessionId) {
      setStatus('error');
      setError(
        'Invalid payment session.'
      );
      return;
    }

    let cancelled = false;

    async function loadStatus() {
      try {
        const response =
          await fetch(
            `/api/orders/status?session_id=${encodeURIComponent(
              sessionId
            )}`,
            {
              cache:
                'no-store'
            }
          );

        const data =
          await response.json();

        if (cancelled) {
          return;
        }

        if (
          !response.ok ||
          !data?.ok
        ) {
          setStatus('error');
          setError(
            data?.error ||
            'Could not verify your order.'
          );
          return;
        }

        setOrder(data);

        if (!data.paid) {
          setStatus(
            'payment_pending'
          );
          return;
        }

        if (
          data.status ===
          'validated'
        ) {
          setStatus(
            'validated'
          );
          return;
        }

        if (
          data.status ===
          'validation_failed'
        ) {
          setStatus(
            'processing'
          );
          return;
        }

        setStatus(
          'processing'
        );
      } catch {
        if (!cancelled) {
          setStatus('error');
          setError(
            'Could not verify your order.'
          );
        }
      }
    }

    loadStatus();

    const interval =
      setInterval(
        loadStatus,
        3000
      );

    return () => {
      cancelled = true;
      clearInterval(
        interval
      );
    };
  }, []);

  function getIcon() {
    if (
      status ===
      'validated'
    ) {
      return (
        <CheckCircle
          size={54}
          strokeWidth={1.5}
        />
      );
    }

    if (
      status ===
      'error'
    ) {
      return (
        <AlertCircle
          size={54}
          strokeWidth={1.5}
        />
      );
    }

    return (
      <Clock3
        size={54}
        strokeWidth={1.5}
      />
    );
  }

  function getTitle() {
    if (
      status ===
      'validated'
    ) {
      return 'Order confirmed';
    }

    if (
      status ===
      'payment_pending'
    ) {
      return 'Payment pending';
    }

    if (
      status ===
      'error'
    ) {
      return 'Order unavailable';
    }

    return 'Preparing your eSIM';
  }

  function getDescription() {
    if (
      status ===
      'validated'
    ) {
      return 'Your payment is confirmed and your eSIM order has been validated.';
    }

    if (
      status ===
      'payment_pending'
    ) {
      return 'We are still waiting for payment confirmation.';
    }

    if (
      status ===
      'error'
    ) {
      return (
        error ||
        'We could not verify this order.'
      );
    }

    return 'Your payment is confirmed. We are preparing your eSIM now.';
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#080808',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        style={{
          maxWidth: '620px',
          width: '100%',
          textAlign: 'center'
        }}
      >
        {getIcon()}

        <div
          style={{
            marginTop: '28px',
            fontSize: '12px',
            letterSpacing: '2px',
            color: '#888'
          }}
        >
          MORROWGO
        </div>

        <h1
          style={{
            fontSize:
              'clamp(38px, 8vw, 60px)',
            margin:
              '12px 0'
          }}
        >
          {getTitle()}
        </h1>

        <p
          style={{
            color: '#999',
            lineHeight: '1.6',
            maxWidth: '500px',
            margin:
              '0 auto'
          }}
        >
          {getDescription()}
        </p>

        {order?.iso && (
          <div
            style={{
              margin:
                '30px auto 0',
              maxWidth:
                '420px',
              border:
                '1px solid #2d2d2d',
              borderRadius:
                '20px',
              padding:
                '20px',
              background:
                '#101010',
              textAlign:
                'left'
            }}
          >
            <div
              style={{
                display:
                  'flex',
                justifyContent:
                  'space-between',
                gap: '20px'
              }}
            >
              <span
                style={{
                  color:
                    '#888'
                }}
              >
                Destination
              </span>

              <strong>
                {order.iso}
              </strong>
            </div>

            {order.amount && (
              <div
                style={{
                  display:
                    'flex',
                  justifyContent:
                    'space-between',
                  gap: '20px',
                  marginTop:
                    '12px'
                }}
              >
                <span
                  style={{
                    color:
                      '#888'
                  }}
                >
                  Paid
                </span>

                <strong>
                  {(
                    Number(
                      order.amount
                    ) / 100
                  ).toFixed(2)}
                  {' '}
                  {String(
                    order.currency ||
                    ''
                  ).toUpperCase()}
                </strong>
              </div>
            )}
          </div>
        )}

        {status ===
          'processing' && (
          <p
            style={{
              marginTop:
                '22px',
              color:
                '#777',
              fontSize:
                '13px'
            }}
          >
            This page updates automatically.
          </p>
        )}

        <button
          onClick={() =>
            router.push('/')
          }
          style={{
            marginTop: '30px',
            border: 0,
            borderRadius:
              '30px',
            padding:
              '15px 24px',
            fontSize:
              '15px',
            fontWeight:
              '600',
            cursor:
              'pointer',
            display:
              'inline-flex',
            alignItems:
              'center',
            gap: '10px'
          }}
        >
          Back to MORROWGO
          <ArrowRight
            size={17}
          />
        </button>
      </div>
    </main>
  );
}
