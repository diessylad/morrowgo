'use client';

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
  return <span className={s.allowance}>{match ? <>{match[1]} <small>{match[2]}</small></> : label}</span>;
}

export default function PlanSelector({ plans, selectedPlan, onSelect, onCheckout, formatData, total, showAll, canExpand, onToggle }) {
  const currencies = [...new Set(plans.map(plan => plan.currency || 'EUR'))];
  return <div className={s.configurator}>
    <div className={s.surface}>
      <div className={s.heading}><h3>Choose your plan</h3><span>{currencies.length === 1 ? `Prices in ${currencies[0]}` : 'Prices as listed'}</span></div>
      <fieldset className={s.options}>
        <legend className={s.srOnly}>Choose your eSIM plan</legend>
        {plans.map(plan => <label key={plan.id} className={`${s.option} ${selectedPlan?.id === plan.id ? s.active : ''}`}>
          <input type="radio" name="esim-plan" checked={selectedPlan?.id === plan.id} onChange={() => onSelect(plan.id)} aria-label={`${formatData(plan)}, ${plan.duration} days, ${price(plan)}${plan.operator ? `, ${plan.operator}` : ''}`}/>
          <span className={s.optionContent}><Allowance plan={plan} formatData={formatData}/><span className={s.validity}>{plan.duration} days</span><span className={`${s.price} ${price(plan).length > 9 ? s.longPrice : ''}`}>{price(plan)}</span></span>
          <span className={s.signature} aria-hidden="true"><i/><i/><i/><i/></span>
        </label>)}
      </fieldset>
      {canExpand && <button className={s.expand} aria-expanded={showAll} onClick={onToggle}>{showAll ? 'Show fewer plans' : `View all ${total} plans`}<span aria-hidden="true">{showAll ? '−' : '+'}</span></button>}
    {selectedPlan && <details className={s.details} key={selectedPlan.id}><summary>Network &amp; plan details <span aria-hidden="true">+</span></summary><div><p><span>Provider</span>{selectedPlan.operator || 'Local networks'}</p>{selectedPlan.networks?.length > 0 && <p><span>Networks</span>{selectedPlan.networks.join(' / ')}</p>}<p><span>Plan type</span>{selectedPlan.packageType === 'data' ? 'Data only' : 'Data + calls + texts'}</p><p><span>Top-ups</span>{selectedPlan.topupAvailable ? 'Subject to eSIM compatibility' : 'Not advertised'}</p>{selectedPlan.fairUsage && <p><span>Fair use</span>{selectedPlan.fairUsage}</p>}</div></details>}
    <div className={s.purchase}>

      <div className={s.action}><button className={s.cta} disabled={!selectedPlan} onClick={() => selectedPlan && onCheckout(selectedPlan)}>{selectedPlan ? <>Get eSIM <span aria-hidden="true">—</span> <span key={selectedPlan.id} className={s.ctaPrice}>{price(selectedPlan)}</span></> : 'Choose a plan'}<ArrowRight size={16}/></button><p>Instant delivery · Secure checkout</p></div>
    </div>
    </div>

  </div>;
}
