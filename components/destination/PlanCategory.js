'use client';
import s from './planCategory.module.css';
export default function PlanCategory({value,onChange}) {
  return <div className={s.switcher} role="group" aria-label="Plan category">
    <button type="button" aria-pressed={value==='fixed'} onClick={()=>onChange('fixed')}>Fixed data</button>
    <button type="button" aria-pressed={value==='unlimited'} onClick={()=>onChange('unlimited')}>Unlimited</button>
  </div>;
}
