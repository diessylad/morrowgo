'use client';

import { useEffect, useState } from 'react';
import {
  Search,
  ArrowRight,
  Globe2,
  Zap,
  Ban,
  Smartphone,
  Headphones,
  ScanLine,
  Signal
} from 'lucide-react';

const destinations = [
  {
    name: 'Germany',
    ru: 'Германия',
    iso: 'DE',
    price: '€4.50',
    image:
      'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Turkey',
    ru: 'Турция',
    iso: 'TR',
    price: '€3.90',
    image:
      'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'USA',
    ru: 'США',
    iso: 'US',
    price: '€4.90',
    image:
      'https://images.unsplash.com/photo-1485871981521-5b1fd3805eee?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Italy',
    ru: 'Италия',
    iso: 'IT',
    price: '€4.90',
    image:
      'https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Spain',
    ru: 'Испания',
    iso: 'ES',
    price: '€4.50',
    image:
      'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=900&q=80'
  },
  {
    name: 'Thailand',
    ru: 'Таиланд',
    iso: 'TH',
    price: '€4.90',
    image:
      'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=900&q=80'
  }
];

const copy = {
  en: {
    destinations: 'Destinations',
    how: 'How it works',
    support: 'Support',
    eyebrow: 'GLOBAL eSIM FOR MODERN TRAVELERS',
    title1: 'Stay connected',
    title2: 'wherever you go',
    desc1:
      'Explore travel data plans for your next destination.',
    desc2: 'Choose the data you need, before you travel.',
    search: 'Where are you travelling to?',
    submitSearch: 'Search destinations',
    chips: [
      'Turkey',
      'USA',
      'Germany',
      'Italy',
      'Spain',
      'France',
      'Thailand',
      'UAE'
    ],
    phone: [
      'Different',
      'Places',
      'Same',
      'Connection'
    ],
    activated: 'Your travel eSIM',
    benefits: [
      ['Explore', 'destinations'],
      ['Easy', 'setup'],
      ['No roaming', 'fees'],
      ['Keep your', 'number'],
      ['Setup', 'guides']
    ],
    popular: 'Popular destinations',
    view: 'View all destinations',
    from: 'From',
    step1: [
      'Choose a plan',
      'Pick your destination and data plan.'
    ],
    step2: [
      'Install eSIM',
      'Once issued, follow your eSIM installation instructions.'
    ],
    step3: [
      'Stay connected',
      'Connect within your plan’s coverage and validity.'
    ],
    cart: 'Cart'
  },

  ru: {
    destinations: 'Страны',
    how: 'Как это работает',
    support: 'Поддержка',
    eyebrow:
      'eSIM ДЛЯ ПУТЕШЕСТВИЙ ПО ВСЕМУ МИРУ',
    title1: 'Всегда на связи',
    title2: 'где бы ты ни был',
    desc1:
      'Выбирайте интернет для следующего путешествия.',
    desc2:
      'Выберите нужный объём интернета до поездки.',
    search:
      'Куда вы путешествуете?',
    submitSearch:
      'Найти направление',
    chips: [
      'Турция',
      'США',
      'Германия',
      'Италия',
      'Испания',
      'Франция',
      'Таиланд',
      'ОАЭ'
    ],
    phone: [
      'Разные',
      'Места',
      'Одна',
      'Связь'
    ],
    activated:
      'Ваша eSIM для поездки',
    benefits: [
      ['Выбор', 'направлений'],
      ['Простая', 'установка'],
      ['Без', 'роуминга'],
      ['Сохрани свой', 'номер'],
      ['Помощь', 'с установкой']
    ],
    popular:
      'Популярные направления',
    view:
      'Все направления',
    from: 'От',
    step1: [
      'Выбери тариф',
      'Выбери страну и пакет интернета.'
    ],
    step2: [
      'Установи eSIM',
      'Получи QR-код и установи eSIM.'
    ],
    step3: [
      'Будь на связи',
      'Пользуйся интернетом в поездке.'
    ],
    cart: 'Корзина'
  }
};

export default function Home() {
  const [lang, setLang] =
    useState('en');

  const [query, setQuery] =
    useState('');

  const [livePrices, setLivePrices] =
    useState({});

  const t = copy[lang];

  useEffect(() => {
    async function loadPrices() {
      const prices = {};

      await Promise.all(
        destinations.map(
          async (destination) => {
            try {
              const response =
                await fetch(
                  `/api/esimgo/catalogue?country=${destination.iso}`
                );

              const data =
                await response.json();

              if (
                data.ok &&
                Array.isArray(
                  data.packages
                ) &&
                data.packages.length > 0
              ) {
                const firstPrice =
                  Number(
                    data.packages[0]
                      .price
                  );

                if (
                  Number.isFinite(
                    firstPrice
                  )
                ) {
                  prices[
                    destination.iso
                  ] = firstPrice;
                }
              }
            } catch {
            }
          }
        )
      );

      setLivePrices(prices);
    }

    loadPrices();
  }, []);

  useEffect(() => {
    document.documentElement.lang =
      lang;
  }, [lang]);

  function submitSearch(event) {
    event.preventDefault();

    const search =
      query.trim();

    window.location.href =
      `/destinations?q=${encodeURIComponent(
        search
      )}`;
  }

  return (
    <main>
      <header className="nav wrap">
        <a className="logo">
          MORROWGO
        </a>

        <nav>
          <a href="#destinations">
            eSIM
          </a>

          <a href="/destinations">
            {t.destinations}
          </a>

          <a href="#how">
            {t.how}
          </a>

          <a href="/help">
            {t.support}
          </a>
        </nav>

        <div className="navRight">
          <Search size={19} />

          <span
            role="button"
            tabIndex={0}
            aria-label={
              lang === 'en'
                ? 'Switch to Russian'
                : 'Переключить на английский'
            }
            onKeyDown={(event) => {
              if (
                event.key ===
                  'Enter' ||
                event.key === ' '
              ) {
                event.preventDefault();

                setLang(
                  lang === 'en'
                    ? 'ru'
                    : 'en'
                );
              }
            }}
            onClick={() =>
              setLang(
                lang === 'en'
                  ? 'ru'
                  : 'en'
              )
            }
            style={{
              cursor: 'pointer'
            }}
          >
            ◎ &nbsp;
            {lang === 'en'
              ? 'EN'
              : 'RU'}
            ⌄
          </span>

          <a className="cart" href="/help" style={{color:'#111'}}>
            {t.support}
          </a>
        </div>
      </header>

      <section className="hero">
        <div className="heroPhoto" />

        <div className="wrap heroGrid">
          <div className="heroCopy">
            <div className="eyebrow">
              {t.eyebrow}
            </div>

            <h1>
              {t.title1}
              <br />
              {t.title2}
            </h1>

            <p>
              {t.desc1}
              <br />
              {t.desc2}
            </p>

            <form
              className="search"
              onSubmit={
                submitSearch
              }
            >
              <Search />

              <input
                type="text"
                aria-label={
                  t.search
                }
                placeholder={
                  t.search
                }
                value={query}
                onChange={(
                  event
                ) =>
                  setQuery(
                    event.target
                      .value
                  )
                }
              />

              <button
                type="submit"
                aria-label={
                  t.submitSearch
                }
              >
                <ArrowRight />
              </button>
            </form>

            <div className="chips">
              {t.chips.map(
                (x) => (
                  <span key={x}>
                    {x}
                  </span>
                )
              )}
            </div>
          </div>

          <div className="phone">
            <div className="phoneTop">
              9:41
              <span>
                ▮▮▮ ᯤ ▰
              </span>
            </div>

            <div className="phoneLogo">
              MORROWGO
            </div>

            <div className="phoneWords">
              {t.phone[0]}
              <br />
              {t.phone[1]}
              <br />
              {t.phone[2]}
              <br />
              {t.phone[3]}
            </div>

            <div className="phoneLine" />

            <div className="activated">
              ✓ &nbsp;
              {t.activated}
            </div>
          </div>

          <div className="sideWords">
            MORE
            <br />
            PLACES
            <br />
            BIGGER
            <br />
            STORIES
            <div />
          </div>
        </div>
      </section>

      <section className="benefits">
        <div className="wrap benefitGrid">
          <Benefit
            icon={<Globe2 />}
            top={
              t.benefits[0][0]
            }
            bottom={
              t.benefits[0][1]
            }
          />

          <Benefit
            icon={<Zap />}
            top={
              t.benefits[1][0]
            }
            bottom={
              t.benefits[1][1]
            }
          />

          <Benefit
            icon={<Ban />}
            top={
              t.benefits[2][0]
            }
            bottom={
              t.benefits[2][1]
            }
          />

          <Benefit
            icon={<Smartphone />}
            top={
              t.benefits[3][0]
            }
            bottom={
              t.benefits[3][1]
            }
          />

          <Benefit
            icon={<Headphones />}
            top={
              t.benefits[4][0]
            }
            bottom={
              t.benefits[4][1]
            }
          />
        </div>
      </section>

      <section
        id="destinations"
        className="wrap destinations"
      >
        <div className="sectionHead">
          <h2>
            {t.popular}
          </h2>

          <button
            onClick={() => {
              window.location.href =
                '/destinations';
            }}
          >
            {t.view}
            <ArrowRight
              size={16}
            />
          </button>
        </div>

        <div className="cards">
          {destinations.map(
            (d) => (
              <article
                className="card"
                tabIndex={0}
                role="link"
                aria-label={`View ${d.name} plans`}
                onKeyDown={event => { if (event.key === "Enter" && event.target === event.currentTarget) window.location.href = `/destination/${d.iso}`; }}
                key={d.name}
                onClick={() => {
                  window.location.href =
                    `/destination/${d.iso}`;
                }}
                style={{
                  cursor:
                    'pointer'
                }}
              >
                <img
                  src={d.image}
                  alt={
                    lang === 'ru'
                      ? d.ru
                      : d.name
                  }
                />

                <div className="cardBody">
                  <strong>
                    {lang ===
                    'ru'
                      ? d.ru
                      : d.name}
                  </strong>

                  <small>
                    {livePrices[d.iso] ? t.from : '\u00a0'}
                  </small>

                  <div>
                    <b>
                      {livePrices[
                        d.iso
                      ]
                        ? `$${livePrices[
                            d.iso
                          ].toFixed(
                            2
                          )}`
                        : (lang === 'ru' ? 'Смотреть тарифы' : 'View plans')}
                    </b>

                    <button aria-label={`View ${d.name} plans`}>
                      <ArrowRight
                        size={16}
                      />
                    </button>
                  </div>
                </div>
              </article>
            )
          )}
        </div>
      </section>

      <section
        id="how"
        className="wrap how"
      >
        <h2>
          {t.how}
        </h2>

        <div className="steps">
          <Step
            n="01"
            icon={<Search />}
            title={
              t.step1[0]
            }
            text={
              t.step1[1]
            }
          />

          <Step
            n="02"
            icon={
              <ScanLine />
            }
            title={
              t.step2[0]
            }
            text={
              t.step2[1]
            }
          />

          <Step
            n="03"
            icon={
              <Signal />
            }
            title={
              t.step3[0]
            }
            text={
              t.step3[1]
            }
          />

          <div className="script">
            Good
            <br />
            Connections
            <br />
            Better
            <br />
            Journeys
          </div>
        </div>
      </section>

      <footer id="support">
        <div className="wrap footerGrid">
          <div>
            <div className="logo">
              MORROWGO
            </div>

            <small>
              STAY CONNECTED.
              <br />
              GO FURTHER.
            </small>
          </div>

          <div className="customerLinks">
            <a href="/help">{lang === 'ru' ? 'Помощь и FAQ' : 'Help & FAQ'}</a>
            <a href="/compatibility">{lang === 'ru' ? 'Совместимость телефона' : 'Device compatibility'}</a>
            <a href="/demo/order">{lang === 'ru' ? 'Пример заказа · демо' : 'Sample order · demo'}</a>
          </div>
          <div className="social" style={{fontSize:12,color:'#aaa',lineHeight:1.7}}>
            {lang === 'ru' ? 'Готовимся к запуску. Выдача eSIM пока выключена.' : 'Pre-launch preview. eSIM delivery is not enabled yet.'}
          </div>
        </div>
      </footer>
    </main>
  );
}

function Benefit({
  icon,
  top,
  bottom
}) {
  return (
    <div className="benefit">
      {icon}

      <div>
        <b>{top}</b>
        <span>
          {bottom}
        </span>
      </div>
    </div>
  );
}

function Step({
  n,
  icon,
  title,
  text
}) {
  return (
    <div className="step">
      <span className="num">
        {n}
      </span>

      <div className="stepIcon">
        {icon}
      </div>

      <div>
        <b>
          {title}
        </b>

        <p>
          {text}
        </p>
      </div>
    </div>
  );
}
