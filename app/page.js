"use client";

import { useMemo, useState } from "react";
import {
  Search,
  ArrowRight,
  Globe2,
  Zap,
  Ban,
  Smartphone,
  Headphones,
  ScanLine,
  Signal,
  Check,
} from "lucide-react";

const destinations = [
  {
    name: "Germany",
    ru: "Германия",
    price: "€4.50",
    image:
      "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Turkey",
    ru: "Турция",
    price: "€3.90",
    image:
      "https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "USA",
    ru: "США",
    price: "€4.90",
    image:
      "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Italy",
    ru: "Италия",
    price: "€4.90",
    image:
      "https://images.unsplash.com/photo-1533104816931-20fa691ff6ca?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Spain",
    ru: "Испания",
    price: "€4.50",
    image:
      "https://images.unsplash.com/photo-1509840841025-9088ba78a826?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Thailand",
    ru: "Таиланд",
    price: "€4.90",
    image:
      "https://images.unsplash.com/photo-1504214208698-ea1916a2195b?auto=format&fit=crop&w=900&q=80",
  },
];

const copy = {
  en: {
    esim: "eSIM",
    destinations: "Destinations",
    how: "How it works",
    support: "Support",
    eyebrow: "GLOBAL eSIM FOR MODERN TRAVELERS",
    title1: "Stay connected",
    title2: "wherever you go",
    desc:
      "Affordable eSIMs in 200+ destinations. Instant activation. No roaming fees. Just freedom.",
    search: "Where are you traveling to?",
    popular: "Popular destinations",
    view: "View all destinations",
    benefits: [
      "200+ destinations",
      "Instant activation",
      "No roaming fees",
      "Keep your number",
      "24/7 support",
    ],
    howTitle: "How it works",
    steps: [
      ["Choose a plan", "Pick your destination and data plan."],
      ["Install eSIM", "Get your QR code and install it in seconds."],
      ["Stay connected", "Enjoy fast and reliable internet anywhere."],
    ],
    slogan: "STAY CONNECTED. GO FURTHER.",
    email: "Your email",
    newsletter: "Get travel tips and exclusive deals.",
    different: ["Different", "Places", "Same", "Connection"],
    activated: "eSIM activated",
    from: "from",
    cart: "Cart",
  },

  ru: {
    esim: "eSIM",
    destinations: "Направления",
    how: "Как это работает",
    support: "Поддержка",
    eyebrow: "ГЛОБАЛЬНАЯ eSIM ДЛЯ СОВРЕМЕННЫХ ПУТЕШЕСТВЕННИКОВ",
    title1: "Оставайся на связи",
    title2: "где бы ты ни был",
    desc:
      "Доступные eSIM более чем в 200 направлениях. Мгновенная активация. Без роуминга. Только свобода.",
    search: "Куда вы путешествуете?",
    popular: "Популярные направления",
    view: "Все направления",
    benefits: [
      "200+ направлений",
      "Мгновенная активация",
      "Без роуминга",
      "Сохрани свой номер",
      "Поддержка 24/7",
    ],
    howTitle: "Как это работает",
    steps: [
      ["Выбери тариф", "Выбери страну и подходящий пакет интернета."],
      [
        "Установи eSIM",
        "Получи QR-код и установи eSIM за несколько секунд.",
      ],
      [
        "Оставайся на связи",
        "Пользуйся быстрым и надёжным интернетом в поездке.",
      ],
    ],
    slogan: "ОСТАВАЙСЯ НА СВЯЗИ. ПУТЕШЕСТВУЙ ДАЛЬШЕ.",
    email: "Ваш email",
    newsletter:
      "Получайте советы для путешествий и специальные предложения.",
    different: ["Разные", "Места", "Одна", "Связь"],
    activated: "eSIM активирована",
    from: "от",
    cart: "Корзина",
  },
};

export default function Home() {
  const [lang, setLang] = useState("en");
  const [query, setQuery] = useState("");

  const t = copy[lang];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (!q) return destinations;

    return destinations.filter(
      (destination) =>
        destination.name.toLowerCase().includes(q) ||
        destination.ru.toLowerCase().includes(q)
    );
  }, [query]);

  const icons = [Globe2, Zap, Ban, Smartphone, Headphones];

  return (
    <main>
      <header className="nav wrap">
        <a className="logo" href="#">
          MORROWGO
        </a>

        <nav className="navlinks">
          <a href="#destinations">{t.esim}</a>
          <a href="#destinations">{t.destinations}</a>
          <a href="#how">{t.how}</a>
          <a href="#support">{t.support}</a>
        </nav>

        <div className="navRight">
          <Search size={17} />

          <button
            className="lang"
            onClick={() => setLang(lang === "en" ? "ru" : "en")}
          >
            {lang === "en" ? "EN" : "RU"}
          </button>

          <button className="cart">
            {t.cart} (0)
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="heroLeft">
          <div className="eyebrow">{t.eyebrow}</div>

          <h1>
            {t.title1}
            <br />
            {t.title2}
          </h1>

          <p>{t.desc}</p>

          <div className="searchBox">
            <Search size={20} />

            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search}
            />

            <button>
              <ArrowRight size={20} />
            </button>
          </div>

          <div className="chips">
            {destinations.map((destination) => (
              <button
                key={destination.name}
                onClick={() =>
                  setQuery(
                    lang === "ru" ? destination.ru : destination.name
                  )
                }
              >
                {lang === "ru" ? destination.ru : destination.name}
              </button>
            ))}
          </div>
        </div>

        <div className="heroPhoto">
          <img
            src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=1600&q=85"
            alt="Airplane"
          />

          <div className="phone">
            <small>9:41</small>

            <b>MORROWGO</b>

            <div className="phoneWords">
              {t.different.map((word) => (
                <span key={word}>{word}</span>
              ))}
            </div>

            <div className="activated">
              <Check size={14} />
              {t.activated}
            </div>
          </div>
        </div>
      </section>

      <section className="benefits">
        {t.benefits.map((benefit, index) => {
          const Icon = icons[index];

          return (
            <div className="benefit" key={benefit}>
              <Icon size={23} />
              <b>{benefit}</b>
            </div>
          );
        })}
      </section>

      <section id="destinations" className="wrap destinations">
        <div className="sectionHead">
          <h2>{t.popular}</h2>

          <button>
            {t.view}
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="cards">
          {filtered.map((destination) => (
            <article className="card" key={destination.name}>
              <img
                src={destination.image}
                alt={destination.name}
              />

              <div className="cardBody">
                <strong>
                  {lang === "ru"
                    ? destination.ru
                    : destination.name}
                </strong>

                <span>
                  {t.from} {destination.price}
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="how" className="wrap how">
        <div className="eyebrow">{t.howTitle}</div>

        <h2>{t.howTitle}</h2>

        <div className="steps">
          {t.steps.map((step, index) => {
            const Icon = [Search, ScanLine, Signal][index];

            return (
              <div className="step" key={step[0]}>
                <div className="stepIcon">
                  <Icon />
                </div>

                <span>0{index + 1}</span>

                <h3>{step[0]}</h3>

                <p>{step[1]}</p>
              </div>
            );
          })}
        </div>
      </section>

      <footer id="support">
        <div className="wrap footer">
          <div>
            <div className="logo">MORROWGO</div>
            <small>{t.slogan}</small>
          </div>

          <div className="newsletter">
            <span>{t.newsletter}</span>

            <div>
              <input placeholder={t.email} />

              <button>
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
