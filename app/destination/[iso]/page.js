'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Wifi
} from 'lucide-react';

export default function DestinationPage() {
  const params = useParams();
  const router = useRouter();

  const iso = String(
    params.iso || ''
  ).toUpperCase();

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
          maxWidth: '900px',
          margin: '0 auto'
        }}
      >
        <button
          onClick={() =>
            router.push(
              '/destinations'
            )
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
          <ArrowLeft
            size={17}
          />
          Back
        </button>

        <div
          style={{
            marginTop: '42px',
            marginBottom:
              '30px'
          }}
        >
          <div
            style={{
              fontSize: '12px',
              letterSpacing: '2px',
              color: '#999',
              marginBottom:
                '12px'
            }}
          >
            MORROWGO eSIM
          </div>

          <h1
            style={{
              fontSize:
                'clamp(36px, 7vw, 64px)',
              fontWeight: '500',
              margin: 0
            }}
          >
            {countryName ||
              iso}
          </h1>

          <p
            style={{
              color: '#aaa',
              fontSize: '16px'
            }}
          >
            Choose your data plan
          </p>
        </div>

        {loading && (
          <p
            style={{
              color: '#aaa'
            }}
          >
            Loading plans...
          </p>
        )}

        {error && (
          <p
            style={{
              color: '#aaa'
            }}
          >
            {error}
          </p>
        )}

        {!loading &&
          !error && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '14px'
              }}
            >
              {packages.map(
                (plan) => (
                  <div
                    key={
                      plan.id
                    }
                    style={{
                      position:
                        'relative',
                      border:
                        plan.popular
                          ? '1px solid #fff'
                          : '1px solid #2d2d2d',
                      background:
                        '#101010',
                      borderRadius:
                        '22px',
                      padding:
                        '22px'
                    }}
                  >
                    {plan.popular && (
                      <div
                        style={{
                          position:
                            'absolute',
                          top: '14px',
                          right:
                            '14px',
                          fontSize:
                            '11px',
                          background:
                            '#fff',
                          color:
                            '#000',
                          borderRadius:
                            '20px',
                          padding:
                            '5px 9px',
                          fontWeight:
                            '600'
                        }}
                      >
                        Popular
                      </div>
                    )}

                    <Wifi
                      size={22}
                      style={{
                        marginBottom:
                          '24px'
                      }}
                    />

                    <div
                      style={{
                        fontSize:
                          '28px',
                        fontWeight:
                          '600'
                      }}
                    >
                      {formatData(
                        plan
                      )}
                    </div>

                    <div
                      style={{
                        marginTop:
                          '7px',
                        color:
                          '#999'
                      }}
                    >
                      {
                        plan.duration
                      }{' '}
                      {plan.duration ===
                      1
                        ? 'day'
                        : 'days'}
                    </div>

                    <div
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        justifyContent:
                          'space-between',
                        marginTop:
                          '30px'
                      }}
                    >
                      <strong
                        style={{
                          fontSize:
                            '22px'
                        }}
                      >
                        $
                        {Number(
                          plan.price
                        ).toFixed(
                          2
                        )}
                      </strong>

                      <button
                        onClick={() =>
                          openCheckout(
                            plan
                          )
                        }
                        aria-label={`Choose ${formatData(
                          plan
                        )}`}
                        style={{
                          width:
                            '44px',
                          height:
                            '44px',
                          borderRadius:
                            '50%',
                          border: 0,
                          cursor:
                            'pointer'
                        }}
                      >
                        <ArrowRight
                          size={18}
                        />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
      </div>
    </main>
  );
}
