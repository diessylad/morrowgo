'use client';
import { useState } from 'react';
import Experience from '../studio/Experience';
import s from './heroReview.module.css';
export default function HeroReview() {
  const [accent,setAccent] = useState('coffee');
  return <><aside className={s.review} aria-label="Local design review"><span>LOCAL DESIGN REVIEW</span><div role="group" aria-label="Color palettes">{[['ink','01 · Original'],['coffee','02 · Coffee'],['cobalt','03 · Cream / Blue']].map(([value,label]) => <button key={value} type="button" aria-pressed={accent===value} onClick={() => setAccent(value)}>{label}</button>)}</div><small>Full palettes · 8-second hero stories</small></aside><Experience heroStories accent={accent}/></>;
}
