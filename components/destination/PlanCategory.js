'use client';
import { Text, Localized } from './../i18n/Provider';
import en from './../../locales/en.json';
import s from './planCategory.module.css';
export default function PlanCategory({value,onChange}) {
  return <Localized as="div" className={s.switcher} role="group" aria-label={en["m_36f8d51e2532"]}>
    <button type="button" aria-pressed={value==='fixed'} onClick={()=>onChange('fixed')}><Text>{en["m_2fdfc6d12480"]}</Text></button>
    <button type="button" aria-pressed={value===en["m_e1a6f0b6f73a"]} onClick={()=>onChange(en["m_e1a6f0b6f73a"])}><Text>{en["m_b8bef37b7153"]}</Text></button>
  </Localized>;
}
