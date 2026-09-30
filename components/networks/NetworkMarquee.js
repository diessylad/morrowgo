'use client';
import { Text, Localized } from './../i18n/Provider';
import en from './../../locales/en.json';

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
  return <Localized as="section" className={s.section} aria-label={en["m_8372e0d17a0f"]}>
    <h2 className={s.heading}><Text>{en["m_551f1d1062bd"]}</Text></h2>
    <div className={s.viewport}>
      <div className={s.track}>
        <Text>{[0, 1].map(copy => <ul key={copy} className={s.group} aria-hidden={copy === 1 ? true : undefined}>
          <Text>{networks.map(name => <li key={name}>{name}</li>)}</Text>
        </ul>)}</Text>
      </div>
    </div>
  </Localized>;
}
