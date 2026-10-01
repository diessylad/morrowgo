'use client';
import en from './../../../locales/en.json';
import { useEffect, useState } from 'react';
import { orderPresentation } from '../../../lib/orderPresentation';
import PurchaseResult from './PurchaseResult';

export default function SuccessPage() {
  const [order, setOrder] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(true);
  const [paused, setPaused] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [copied, setCopied] = useState('');
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('session_id') || '';
    setSessionId(id);
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) { setError(en["m_32c848c5011f"]); setChecking(false); return; }
    let cancelled = false, timer, deadline, attempts = 0;
    const controller = new AbortController();
    setError(''); setPaused(false); setChecking(true);
    async function load() {
      try {
        deadline = setTimeout(() => controller.abort(), 15000);
        const response = await fetch(`/api/orders/status?session_id=${encodeURIComponent(id)}`, { cache: 'no-store', signal: controller.signal });
        const data = await response.json();
        clearTimeout(deadline);
        if (cancelled) return;
        if (!response.ok || !data.ok) throw new Error('status');
        setOrder(data); setChecking(false);
        if (orderPresentation(data).poll) {
          if (++attempts < 20) timer = setTimeout(load, 3000);
          else setPaused(true);
        }
      } catch {
        clearTimeout(deadline);
        if (!cancelled) { setChecking(false); setError(en["m_2ea9260730a1"]); }
      }
    }
    load();
    return () => { cancelled = true; controller.abort(); clearTimeout(timer); clearTimeout(deadline); };
  }, [refresh]);
  const view = orderPresentation(order);
  const total = Number.isFinite(order?.amount) && ['usd','eur'].includes(order?.currency)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency.toUpperCase(), currencyDisplay: 'code' }).format(order.amount / 100)
    : null;
  async function copyReference() {
    try { await navigator.clipboard.writeText(sessionId); setCopied(en["m_0c6fb9b35a45"]); }
    catch { setCopied(en["m_991939987584"]); }
  }
  async function copyInstallation(value, label) {
    try { await navigator.clipboard.writeText(String(value)); setCopied(`${label} copied.`); }
    catch { setCopied(en["m_7263bcf330df"]); }
  }
  return <PurchaseResult order={order} view={view} total={total} error={error} checking={checking} paused={paused} sessionId={sessionId} copied={copied} onRefresh={()=>setRefresh(v=>v+1)} onCopyReference={copyReference} onCopyInstallation={copyInstallation}/>;
}
