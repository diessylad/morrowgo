'use client';
import { Text, Localized, useLanguage } from './../../components/i18n/Provider';
import en from './../../locales/en.json';

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

import LanguageSelect from '../../components/i18n/LanguageSelect';
import Header from '../../components/shared/Header';
import DestinationLoading from '../../components/loading/DestinationLoading';
import mobile from '../../components/shared/mobile.module.css';
import HeroWaves from '../../components/studio/HeroWaves';
import styles from './destinations.module.css';
import { safeReturnPath } from '../../lib/navigation/returnPath.mjs';

import { useRouter } from 'next/navigation';

function getFlag(iso) {
  return iso
    .toUpperCase()
    .replace(
      /./g,
      (char) =>
        String.fromCodePoint(
          127397 +
            char.charCodeAt()
        )
    );
}

function getCountryName(
  iso,
  language
) {
  try {
    const names =
      new Intl.DisplayNames(
        [language],
        {
          type: 'region'
        }
      );

    return names.of(iso) || iso;
  } catch {
    return iso;
  }
}

export default function DestinationsPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [region, setRegion] = useState('All destinations');

  const [countries, setCountries] =
    useState([]);

  const [query, setQuery] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState('');

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    const search =
      params.get('q') || '';

    setQuery(search);
  }, []);

  useEffect(() => {
    async function loadCountries() {
      try {
        setLoading(true);
        setError('');

        const response = await fetch(
          '/api/catalogue/countries'
        );

        const data =
          await response.json();

        if (
          !data.ok ||
          !Array.isArray(
            data.countries
          )
        ) {
          throw new Error(
            en["m_83007793b783"]
          );
        }

        const prepared =
          data.countries
            .map((item) => ({
              iso: item.iso,
              region: item.region,
              fromPrice: item.fromPrice,

              name:
                getCountryName(
                  item.iso,
                  'en'
                ),

              ru:
                getCountryName(
                  item.iso,
                  'ru'
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
          en["m_3cf01618d8bb"]
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
          t(country.name)
            .toLowerCase()
            .includes(search) ||

          country.ru
            .toLowerCase()
            .includes(search) ||

          country.iso
            .toLowerCase()
            .includes(search)
      );
    }, [
      countries,
      language,
      query
    ]);

  const visibleCountries = filteredCountries.filter(country => {
    if (region === 'All destinations') return true;
    if (region === 'Popular') return ['JP','IT','US','TH','FR','ES'].includes(country.iso);
    if (region === 'Africa') return 'DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU YT MA MZ NA NE NG RE RW SH ST SN SC SL SO ZA SS SD TZ TG TN UG EH ZM ZW'.split(' ').includes(country.iso);
    if (region === 'Oceania') return 'AS AU CK FJ PF GU KI MH FM NR NC NZ NU NF MP PW PG PN WS SB TK TO TV VU WF'.split(' ').includes(country.iso);
    return country.region === region;
  });
  return <><div className={`${mobile.only} ${styles.mobileHeader}`}><Header pageSurface/></div>
    <main className={styles.page}>
      <div className={styles.atmosphere} aria-hidden="true"><HeroWaves atmosphere={false}/><img className={styles.globe} src="/brand/destinations-globe.jpg" alt="" width="1536" height="1024"/></div>
      <svg className={styles.routes} viewBox="0 0 1600 450" fill="none" aria-hidden="true"><path d="M-40 150C200 140 240 380 610 220S1340-20 1230 160 1420 240 1660 390"/><path d="M0 220C190 480 410 90 730 320"/><circle cx="610" cy="220" r="3"/><circle cx="1225" cy="170" r="3"/></svg>
      <div className={styles.wrap}>
        <div className={styles.top}><button className={styles.back} onClick={()=>router.push(safeReturnPath(new URLSearchParams(window.location.search).get('returnTo')))}><ArrowLeft size={18}/><Text>{en["m_b52b36b7269f"]}</Text></button><div className={styles.language}><LanguageSelect/></div></div>
        <section className={styles.hero} aria-labelledby="destinations-title">
          <div><div className={styles.eyebrow}>01 / <Text>EXPLORE</Text><strong>MORROWGO eSIM</strong></div><h1 id="destinations-title"><Text>{en["m_0fc66bc4363c"]}</Text></h1><p><Text>{en["m_0664178124a8"]}</Text></p></div>
          <p className={styles.aside}><Text>A small world.</Text><br/><Text>A lot to discover.</Text></p>
        </section>
        <div className={styles.search}><Search size={23} aria-hidden="true"/><Localized as="input" value={query} onChange={event=>setQuery(event.target.value)} placeholder={en["m_4238725c85c1"]} aria-label={en["m_4238725c85c1"]}/></div>
        <div className={styles.filterRow}><div className={styles.filters} aria-label="Filter destinations">{['All destinations','Europe','Asia','Americas','Africa','Oceania','Popular'].map(value=><button key={value} aria-pressed={region===value} onClick={()=>setRegion(value)}><Text>{value}</Text></button>)}</div>{!loading&&!error&&<span className={styles.count} aria-live="polite">{visibleCountries.length} <Text>{en["m_773a3b986de1"]}</Text></span>}</div>
        <DestinationLoading loading={loading} error={error}>
          {!loading&&!error&&<div className={styles.grid}>{visibleCountries.map(country=><button className={styles.card} key={country.iso} onClick={()=>router.push(`/destination/${country.iso}`)}><span className={styles.flag} aria-hidden="true">{getFlag(country.iso)}</span><span className={styles.cardText}><strong><Text>{t(country.name)}</Text></strong><span><Text>{`From €${country.fromPrice.toFixed(2)}`}</Text></span></span><ArrowRight size={18} aria-hidden="true"/></button>)}</div>}
          {!loading&&!error&&!visibleCountries.length&&<p className={styles.empty} role="status"><Text>No destinations found.</Text></p>}
        </DestinationLoading>
      </div>
    </main></>;
}
