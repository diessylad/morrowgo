"use client";

import { useEffect, useRef } from 'react';
import { mountWaves } from './horizonWaves';
import styles from './heroWaves.module.css';

// Licensed HorizonX adaptation; see horizonWaves.js and docs/HORIZONX-WAVES-LICENSE.md.
export default function HeroWaves({ atmosphere = true, atmosphereSrc = "/brand/hero-travel-atmosphere.webp", waves = true }) {
  const canvas = useRef(null);
  useEffect(() => {
    if (!waves) return;
    const node = canvas.current;
    let scene;
    try {
      scene = mountWaves(node, {}, message => {
        node.style.visibility = message ? 'hidden' : 'visible';
        node.dataset.wavesReady = message ? 'false' : 'true';
      });
    } catch {
      node.style.visibility = 'hidden';
    }
    return () => scene?.destroy();
  }, [waves]);
  return <div className={styles.background} aria-hidden="true">{waves && <canvas ref={canvas} className={styles.canvas}/>}{atmosphere && <img className={styles.atmosphere} src={atmosphereSrc} alt="" width="1743" height="902" decoding="async"/>}</div>;
}
