"use client";
import { motion, useReducedMotion } from 'motion/react';
import { Text, useLanguage } from '../i18n/Provider';
import { premiumTransition } from '../shared/MotionPrimitives';
import s from './quickBuy.module.css';

// Native radio controls retain keyboard selection and announce the chosen plan.
export default function QuickBuyPlan({ plan, selected, onSelect, formatData, group, index }) {
  const { language } = useLanguage();
  const reduced = useReducedMotion();
  const amount = new Intl.NumberFormat(language === 'en' ? 'en-IE' : language, {
    style:'currency', currency:/^[A-Z]{3}$/.test(plan.currency || '') ? plan.currency : 'EUR'
  }).format(Number(plan.price));
  const speed = plan.speed || plan.networkTypes?.join(' / ');
  return <motion.label className={`${s.choice} ${selected ? s.choiceSelected : ''}`}
    initial={reduced ? false : {opacity:0,y:6}} animate={{opacity:1,y:0}}
    transition={{...premiumTransition,duration:reduced?0:.22,delay:reduced?0:Math.min(index,4)*.035}}>
    <input type="radio" name={group} checked={selected} onChange={() => onSelect(plan)} />
    <span className={s.choiceBody}><strong><Text>{formatData(plan)}</Text></strong><span><Text>{`${plan.duration} days`}</Text>{plan.packageType==='data' && <> · <Text>Data only</Text></>}{speed && <> · <Text>{speed}</Text></>}</span>
    {plan.fairUsage && <small><Text>{plan.fairUsage}</Text></small>}</span>
    <span className={s.choicePrice}><strong>{amount}</strong><small><Text>Total</Text></small></span>
  </motion.label>;
}
