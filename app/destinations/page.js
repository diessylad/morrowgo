'use client';

import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  Search,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

import { useRouter } from 'next/navigation';

function getFlag(iso) {
  return iso
    .toUpperCase()
    .replace(
      /./g,
      (char) =>
        String.fromCodePoint(
          127397 + char.charCodeAt()
        )
    );
}

function getCountryName(iso) {
  try {
    const names = new Intl.DisplayNames(
      ['en'],
      { type: 'region' }
    );

    return names.of(iso) || iso;
  } catch {
    return iso;
  }
}

export default function DestinationsPage() {
  const router = useRouter();

  const [countries, setCountries] =
    useState([]);

  const [query, setQuery] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    async function loadCountries() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          '/api/esimgo/countries'
        );

        const data =
          await response.json();

        if (
          !data.ok ||
          !Array.isArray(data.countries)
        ) {
          throw new Error(
            'Could not load destinations'
          );
        }

        const prepared =
          data.countries
            .map((item) => ({
              iso: item.iso,
              name:
                getCountryName(
                  item.iso
                )
            }))
            .sort((a, b) =>
              a.name.localeCompare(
                b.name
              )
            );

        setCountries(prepared);
      } catch {
        setError(
          'Could not load destinations.'
        );
      } finally {
        setLoading(false);
      }
    }

    loadCountries();
  }, []);

  const filteredCountries =
    useMemo(() => {
      const search =
        query
          .trim()
          .toLowerCase();

      if (!search) {
        return countries;
      }

      return countries.filter(
        (country) =>
          country.name
            .toLowerCase()
            .includes(search) ||
          country.iso
            .toLowerCase()
            .includes(search)
      );
    }, [countries, query]);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#080808',
        color: '#f5f5f5',
        padding:
          '28px 18px 80px'
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto'
        }}
      >
        <button
          onClick={() =>
            router.push('/')
          }
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            border:
              '1px solid #333',
            background: '#111',
            color: '#fff',
            borderRadius: '30px',
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
              color: '#888',
              marginBottom: '12px'
            }}
          >
            MORROWGO eSIM
          </div>

          <h1
            style={{
              fontSize:
                'clamp(38px, 7vw, 68px)',
              fontWeight: '500',
              margin: 0
            }}
          >
            Destinations
          </h1>

          <p
            style={{
              color: '#999',
              fontSize: '16px',
              marginTop: '12px'
            }}
          >
            Choose your destination
            and find the best eSIM
            plan.
          </p>
        </div>

        <div
          style={{
            marginTop: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border:
              '1px solid #2d2d2d',
            background: '#101010',
            borderRadius: '50px',
            padding:
              '0 18px',
            height: '56px'
          }}
        >
          <Search
            size={20}
            color="#888"
          />

          <input
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value
              )
            }
            placeholder="Search country"
            style={{
              flex: 1,
              background:
                'transparent',
              border: 0,
              outline: 'none',
              color: '#fff',
              fontSize: '16px'
            }}
          />
        </div>

        {!loading && !error && (
          <div
            style={{
              marginTop: '18px',
              color: '#777',
              fontSize: '14px'
            }}
          >
            {
              filteredCountries.length
            }{' '}
            destinations
          </div>
        )}

        {loading && (
          <p
            style={{
              marginTop: '40px',
              color: '#999'
            }}
          >
            Loading destinations...
          </p>
        )}

        {error && (
          <p
            style={{
              marginTop: '40px',
              color: '#999'
            }}
          >
            {error}
          </p>
        )}

        {!loading &&
          !error && (
            <div
              style={{
                marginTop: '24px',
                display: 'grid',
                gridTemplateColumns:
                  'repeat(auto-fit, minmax(230px, 1fr))',
                gap: '12px'
              }}
            >
              {filteredCountries.map(
                (country) => (
                  <button
                    key={
                      country.iso
                    }
                    onClick={() =>
                      router.push(
                        `/destination/${country.iso}`
                      )
                    }
                    style={{
                      border:
                        '1px solid #292929',
                      background:
                        '#101010',
                      color: '#fff',
                      borderRadius:
                        '18px',
                      padding:
                        '18px',
                      display:
                        'flex',
                      alignItems:
                        'center',
                      justifyContent:
                        'space-between',
                      cursor:
                        'pointer',
                      textAlign:
                        'left'
                    }}
                  >
                    <div
                      style={{
                        display:
                          'flex',
                        alignItems:
                          'center',
                        gap: '14px'
                      }}
                    >
                      <span
                        style={{
                          fontSize:
                            '26px'
                        }}
                      >
                        {getFlag(
                          country.iso
                        )}
                      </span>

                      <div>
                        <div
                          style={{
                            fontSize:
                              '16px',
                            fontWeight:
                              '600'
                          }}
                        >
                          {
                            country.name
                          }
                        </div>

                        <div
                          style={{
                            marginTop:
                              '3px',
                            color:
                              '#777',
                            fontSize:
                              '12px'
                          }}
                        >
                          {
                            country.iso
                          }
                        </div>
                      </div>
                    </div>

                    <ArrowRight
                      size={17}
                    />
                  </button>
                )
              )}
            </div>
          )}
      </div>
    </main>
  );
}
