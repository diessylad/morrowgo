 'use client';
import { Text } from '../../components/i18n/Provider';
import en from '../../locales/en.json';
import Header from '../../components/customer/Header';
import s from '../../components/customer/customer.module.css';
import checkout from './checkout.module.css';
import { countryFlag } from '../../lib/account/presentation.mjs';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';
export default function CheckoutView({plan, iso, compatible, setCompatible, cancelled, loading, paymentLoading, error, formatData, continueToPayment}) {
  return <div className={`${s.page} ${checkout.page}`}><Header/>
    <main className={`${s.wrap} ${checkout.content}`}>
      <span className={s.label}><Text>{en["m_84315e853c24"]}</Text></span>
      <h1 className={`${s.title} ${checkout.heading}`}>{plan && /^[A-Z]{2}$/.test(iso) && <span className={checkout.flag} aria-hidden="true">{countryFlag(iso)}</span>}<Text>{plan?.country || en["m_b96ddaab20ff"]}</Text></h1>
      <p className={s.intro}><Text>{en["m_7b95ac1b9268"]}</Text></p>
      {cancelled && <p className={s.notice}><Text>{en["m_fc047e947793"]}</Text></p>}
      {loading && <p role="status"><Text>{en["m_8382938cd1cd"]}</Text></p>}
      {error && <p role="alert"><Text>{error}</Text></p>}
      {plan && <div className={checkout.layout}>
        <section className={`${s.card} ${checkout.plan}`}>
          <span className={s.label}><Text>{en["plans.packageDetails"] || 'Package details'}</Text></span>
          <h2><Text>{formatData(plan)}</Text></h2>
          <p className={checkout.validity}><Text>{plan.duration}</Text><Text>{en["m_6deff958bc5e"]}</Text><Text>{plan.country}</Text></p>
          <details className={checkout.networks}><summary><Text>{plan.operator || 'Network details'}</Text></summary><p>{plan.networks?.join(' / ')}</p></details>
          <Link href={`/destination/${encodeURIComponent(iso)}`} className={checkout.change}><ArrowLeft size={16}/><Text>{en["m_badd385121c5"]}</Text></Link>
        </section>
        <section className={`${s.card} ${checkout.summary}`}>
          <div className={checkout.total}><span><Text>Total</Text></span><strong>€{Number(plan.price).toFixed(2)}</strong></div>
          <label className={checkout.confirm}><input type="checkbox" checked={compatible} onChange={e => setCompatible(e.target.checked)}/><span><Text>{en["m_5e24d317fbba"]}</Text></span></label>
          <Link href="/compatibility" className={checkout.compatibility}><Text>{en["m_6c5503aa1111"]}</Text></Link>
          <button className={`${s.button} ${checkout.pay}`} onClick={continueToPayment} disabled={paymentLoading || !compatible}><Text>{paymentLoading ? en["m_8ed3c2197f2d"] : `Continue — €${Number(plan.price).toFixed(2)}`}</Text>{!paymentLoading && <ArrowRight size={18}/>}</button>
          <div className={checkout.sandbox}><span className={s.label}><Text>{en["m_8b5bd1d3e985"]}</Text></span><p><Text>{en["m_140631c26af0"]}</Text></p></div>
        </section>
      </div>}
    </main>
  </div>;
}
