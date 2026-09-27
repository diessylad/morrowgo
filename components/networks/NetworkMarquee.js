'use client';

import { useEffect, useState } from 'react';
import s from './networkMarquee.module.css';

export default function NetworkMarquee() {
  const [networks, setNetworks] = useState([]);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/catalogue/networks', { signal: controller.signal })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (Array.isArray(data?.networks)) setNetworks(data.networks); })
      .catch(() => {});
    return () => controller.abort();
  }, []);
  if (!networks.length) return null;
  return <section className={s.section} aria-label="Supported mobile networks">
    <h2>Connected across leading mobile networks</h2>
    <div className={s.viewport}>
      <div className={s.track}>
        {[0, 1].map(copy => <ul key={copy} className={s.group} aria-hidden={copy === 1 ? true : undefined}>
          {networks.map(name => <li key={name}>{name}</li>)}
        </ul>)}
      </div>
    </div>
  </section>;
}
