'use client';

import { useEffect, useId, useRef } from 'react';
import styles from './heroNetwork.module.css';

// Decorative only: independent of catalogue data, hero geometry and interactions.
export default function HeroNetwork() {
  const layer = useRef(null);
  const id = useId().replace(/:/g, '');
  useEffect(() => {
    const element = layer.current;
    const section = element.closest('section');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let visible = true;
    const update = () => {
      frame = 0;
      if (reduced.matches) { element.style.removeProperty('transform'); return; }
      const rect = section.getBoundingClientRect();
      const progress = Math.max(0, Math.min(1, -rect.top / rect.height));
      element.style.transform = `translate3d(0,${progress * (innerWidth < 768 ? 12 : 24)}px,0)`;
    };
    const schedule = () => { if (visible && !frame) frame = requestAnimationFrame(update); };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) schedule(); });
    observer.observe(section);
    addEventListener('scroll', schedule, { passive: true });
    reduced.addEventListener('change', update);
    update();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); removeEventListener('scroll', schedule); reduced.removeEventListener('change', update); };
  }, []);
  return <div ref={layer} className={styles.layer} aria-hidden="true">
    <svg viewBox="0 0 900 620" fill="none" focusable="false">
      <defs><pattern id={`${id}-dots`} width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#52645d"/></pattern></defs>
      <g fill={`url(#${id}-dots)`} className={styles.map}>
        <path d="M76 133 102 107 151 92 187 104 222 93 252 115 244 139 220 150 202 178 170 191 152 221 125 211 119 179 92 164Z M150 218 171 215 192 237 212 247 207 263 180 254Z M220 270 252 263 283 281 303 310 287 342 270 357 258 395 241 418 228 384 223 343 206 307Z M246 68 292 58 314 72 295 112 269 130 250 106Z"/>
        <path d="M388 153 405 133 429 135 445 120 474 130 475 148 453 161 445 179 417 172 397 185 382 172Z M391 194 421 180 461 193 485 224 474 252 454 278 444 320 421 345 404 325 395 286 371 252 372 219Z M461 122 487 92 541 89 566 105 607 94 643 110 688 104 728 130 768 137 787 161 764 174 737 171 719 196 695 199 670 233 636 227 617 253 597 227 574 233 557 199 531 181 507 190 479 167Z M559 233 579 243 592 279 579 298 564 266Z M630 245 651 256 663 283 682 301 670 311 650 289Z M703 213 711 202 717 218 708 235Z M737 187 745 170 750 188 740 206Z M685 351 716 326 749 329 780 352 787 382 759 402 726 393 697 400 678 375Z M804 397 813 382 819 402 808 423Z"/>
      </g>
      <g className={styles.routes} stroke="#658171" strokeWidth=".85">
        <path d="M186 173 Q295 40 414 149"/>
        <path d="M414 149 Q581 4 741 190"/>
        <path d="M186 173 C294 390 596 455 741 190"/>
      </g>
      <g className={styles.nodes} fill="#627d6b">
        {[[186,173],[414,149],[741,190]].map(([x,y],i)=><g key={x}><circle cx={x} cy={y} r="2.6"/><circle className={styles.pulse} style={{animationDelay:`${i * 1.3}s`}} cx={x} cy={y} r="6" fill="none" stroke="currentColor" strokeWidth=".7"/></g>)}
      </g>
      <g className={styles.labels} fill="#65716a" fontSize="9" fontFamily="Arial, sans-serif"><text x="151" y="195">New York</text><text x="425" y="143">London</text><text x="754" y="188">Tokyo</text></g>
      <g className={styles.circuit} stroke="#658171" strokeWidth=".8" transform="translate(770 440) rotate(-12)"><path d="M0 9Q0 0 9 0H29L41 12V43Q41 50 34 50H8Q0 50 0 42Z M0 17H15V33H0 M41 17H26V33H41 M15 0V12H26V0 M15 50V39H26V50 M15 25H26"/></g>
    </svg>
  </div>;
}
