'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import s from './heroEsimScene.module.css';

// Anchors retain the approved composition; nested transforms separate float and parallax.
const cards = [
  { x: '20%', y: '3%', size: '10%', angle: 16, depth: 'back' },
  { x: '33%', y: '0%', size: '17%', angle: 48, depth: 'middle' },
  { x: '62%', y: '9%', size: '10%', angle: 30, depth: 'back' },
  { x: '68%', y: '20%', size: '17%', angle: -9, depth: 'middle' },
  { x: '22%', y: '48%', size: '18%', angle: 5, depth: 'front' },
  { x: '17%', y: '24%', size: '15%', angle: -12, depth: 'middle', extra: true },
];

export default function HeroEsimScene() {
  const root = useRef(null);
  useEffect(() => {
    const el = root.current;
    const host = el.parentElement;
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    let frame;
    const reset = () => { el.style.setProperty('--px', '0px'); el.style.setProperty('--py', '0px'); };
    const move = event => {
      if (media.matches || event.pointerType !== 'mouse') return;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const box = host.getBoundingClientRect();
        const x = Math.max(-1, Math.min(1, (event.clientX - box.left) / box.width * 2 - 1));
        const y = Math.max(-1, Math.min(1, (event.clientY - box.top) / box.height * 2 - 1));
        el.style.setProperty('--px', `${x * 4}px`);
        el.style.setProperty('--py', `${y * 4}px`);
      });
    };
    host.addEventListener('pointermove', move);
    host.addEventListener('pointerleave', reset);
    media.addEventListener('change', reset);
    return () => { cancelAnimationFrame(frame); host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', reset); media.removeEventListener('change', reset); };
  }, []);
  return <div ref={root} className={s.scene} aria-hidden="true">
    <Image className={s.monkey} src="/brand/hero-monkey-esim.png" alt="" width={1254} height={1254} sizes="(max-width:700px) 90vw, 700px" priority />
    {cards.map((card, index) => <div key={index} className={s.card} data-depth={card.depth} data-extra={card.extra || undefined} data-lit={[1,3,4].includes(index) || undefined} style={{ left: card.x, top: card.y, width: card.size, '--angle': `${card.angle}deg`, '--duration': `${[13,11,14,10,12,13][index]}s`, '--delay': `${[0,-3,-7,-2,-5,-8][index]}s`, '--float-x': `${[3,-4,3,-3,4,-3][index]}px`, '--float-y': `${[4,5,-4,6,-5,4][index]}px` }}>
      <div className={s.cardParallax}><div className={s.cardFloat}>

        {index === 1 && <svg className={s.edgePulse} viewBox="0 0 1254 1254" aria-hidden="true">
          <defs>
            <filter id="hero-esim-edge" x="-5%" y="-5%" width="110%" height="110%">
              <feMorphology in="SourceAlpha" operator="erode" radius="2" result="inner" />
              <feComposite in="SourceAlpha" in2="inner" operator="out" result="edge" />
              <feFlood floodColor="#b5e6ce" /><feComposite in2="edge" operator="in" />
            </filter>
            <linearGradient id="hero-esim-band" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="white" stopOpacity="0" /><stop offset=".5" stopColor="white" /><stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id="hero-esim-sweep" maskUnits="userSpaceOnUse" x="0" y="0" width="1254" height="1254">
              <rect className={s.edgeSweep} x="0" y="-220" width="1254" height="220" fill="url(#hero-esim-band)" />
            </mask>
          </defs>
          <image href="/brand/hero-esim-angle-b.png" width="1254" height="1254" filter="url(#hero-esim-edge)" mask="url(#hero-esim-sweep)" />
        </svg>}
        <Image className={s.esim} src="/brand/hero-esim-angle-b.png" alt="" width={1254} height={1254} sizes="180px" />
      </div></div>
    </div>)}
    <div className={`${s.fog} ${s.fogBack}`}>
      <Image src="/brand/hero-approved-fog.png" alt="" width={2172} height={724} sizes="(max-width:700px) 110vw, 900px" />
    </div>
    <div className={`${s.fog} ${s.fogFront}`}>
      <Image src="/brand/hero-approved-fog.png" alt="" width={2172} height={724} sizes="(max-width:700px) 110vw, 900px" />
    </div>
  </div>;
}
