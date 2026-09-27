'use client';
import { Text, Localized } from './../i18n/Provider';
import en from './../../locales/en.json';

import { ArrowRight } from 'lucide-react';
import s from './plans.module.css';

function price(plan) {
  const currency = /^[A-Z]{3}$/.test(plan.currency || '') ? plan.currency : 'EUR';
  try { return new Intl.NumberFormat('en-IE', { style: 'currency', currency, maximumFractionDigits: 2 }).format(Number(plan.price)); }
  catch { return `${currency} ${Number(plan.price).toFixed(2)}`; }
}

function Allowance({ plan, formatData }) {
  const label = formatData(plan);
  const match = label.match(/^(.+) (GB|MB)$/);
  return <span className={s.allowance}><Text>{match ? <><Text>{match[1]}</Text> <small><Text>{match[2]}</Text></small></> : label}</Text></span>;
}

export default function PlanSelector({ plans, selectedPlan, onSelect, onCheckout, formatData, total, showAll, canExpand, onToggle }) {
  const currencies = [...new Set(plans.map(plan => plan.currency || 'EUR'))];
  return <div className={s.configurator}>
    <div className={s.surface}>
      <div className={s.heading}><h3><Text>{en["m_12a7bc47d455"]}</Text></h3><span><Text>{currencies.length === 1 ? `Prices in ${currencies[0]}` : en["m_1f8ed399c693"]}</Text></span></div>
      <fieldset className={s.options}>
        <legend className={s.srOnly}><Text>{en["m_8482b1347a98"]}</Text></legend>
        {plans.map(plan => <label key={plan.id} className={`${s.option} ${selectedPlan?.id === plan.id ? s.active : ''}`}>
          <Localized as="input" type="radio" name="esim-plan" checked={selectedPlan?.id === plan.id} onChange={() => onSelect(plan.id)} aria-label={`${formatData(plan)}, ${plan.duration} days, ${price(plan)}${plan.operator ? `, ${plan.operator}` : ''}`}/>
          <span className={s.optionContent}><Allowance plan={plan} formatData={formatData}/><span className={s.validity}><Text>{plan.duration}</Text><Text>{en["m_e72d54a2814d"]}</Text></span><span className={`${s.price} ${price(plan).length > 9 ? s.longPrice : ''}`}><Text>{price(plan)}</Text></span></span>
          <span className={s.signature} aria-hidden="true"><i/><i/><i/><i/></span>
        </label>)}
      </fieldset>
      <Text>{canExpand && <button className={s.expand} aria-expanded={showAll} onClick={onToggle}><Text>{showAll ? en["m_8da451d7ca7f"] : `View all ${total} plans`}</Text><span aria-hidden="true"><Text>{showAll ? '−' : '+'}</Text></span></button>}</Text>
    {selectedPlan && <details className={s.details} key={selectedPlan.id}><summary><Text>{en["m_33fae7d53fbb"]}</Text><span aria-hidden="true">+</span></summary><div><p><span><Text>{en["m_7ceee3f3615a"]}</Text></span>{selectedPlan.operator || en["m_21fcc6de8b55"]}</p>{selectedPlan.networks?.length > 0 && <p><span><Text>{en["m_e931cb5b030b"]}</Text></span>{selectedPlan.networks.join(' / ')}</p>}<p><span><Text>{en["m_aee0d8dd793f"]}</Text></span><Text>{selectedPlan.packageType === 'data' ? en["m_c646cf24f147"] : en["m_562e6da06518"]}</Text></p><p><span><Text>{en["m_3d9e3a2b28e0"]}</Text></span><Text>{selectedPlan.topupAvailable ? en["m_4ad18196973f"] : en["m_b0300df5a163"]}</Text></p><Text>{selectedPlan.fairUsage && <p><span><Text>{en["m_a2ed706aaefc"]}</Text></span><Text>{selectedPlan.fairUsage}</Text></p>}</Text></div></details>}
    <div className={s.purchase}>

      <div className={s.action}><button className={s.cta} disabled={!selectedPlan} onClick={() => selectedPlan && onCheckout(selectedPlan)}>{selectedPlan ? <><Text>{en["m_3d91669bf50b"]}</Text><span aria-hidden="true">—</span> <span key={selectedPlan.id} className={s.ctaPrice}><Text>{price(selectedPlan)}</Text></span></> : en["m_4550f6847923"]}<ArrowRight size={16}/></button><p><Text>{en["m_a4c3b99e82ff"]}</Text></p></div>
    </div>
    </div>

  </div>;
}
