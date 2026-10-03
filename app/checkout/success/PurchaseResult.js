 'use client';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Check, Smartphone, Copy, Headphones, ArrowLeft, Loader2 } from 'lucide-react';
import Header from '../../../components/customer/Header';
import { Text, useLanguage } from '../../../components/i18n/Provider';
import { countryFlag, countryName } from '../../../lib/account/presentation.mjs';
import s from './success.module.css';
import ConnectionSteps from '../../../components/account/ConnectionSteps';
import dynamic from 'next/dynamic';
const PurchaseConfetti=dynamic(()=>import('../../../components/ui/PurchaseConfetti'),{ssr:false});

export default function PurchaseResult({order,view,total,error,checking,paused,sessionId,copied,onRefresh,onCopyReference,onCopyInstallation}) {
  const reduced=useReducedMotion(), {language}=useLanguage();
  const ready=view.key==='ready', attention=view.key==='attention', paid=order?.paid===true;
  const installable=ready && !!order?.accountOrderId && !error;
  const sandbox=order?.testMode===true;
  const country=order?.iso ? countryName({destinationIso:order.iso},language) : null;
  const installHref=installable?`/account/esims?install=${order.accountOrderId}#esim-${order.accountOrderId}`:'/account/esims';
  const title=error?'Let’s check your order.':ready?(sandbox?'Your test eSIM is ready.':'Your eSIM is ready.'):attention?'Your order needs a little help.':paid?'Payment confirmed.':'Checking your payment.';
  const description=error?error:ready?(sandbox?'Your test order is complete. You can view your eSIM and explore the installation details in your account.':'Your next connection is ready. Open your eSIM to find the QR code and step-by-step installation instructions.'):attention?'Your payment is confirmed, but your eSIM needs attention. Please contact us before placing another order.':paid?'We’re preparing your eSIM. Its installation details will appear in your account when it’s ready.':'We’re checking your order. Please keep this page open for the latest update.';
  const fields=Object.entries(order?.installation||{}).filter(([key,value])=>['smdpAddress','activationCode','matchingId'].includes(key)&&value);
  return <div className={s.page}><PurchaseConfetti active={ready&&paid&&!error} celebrationKey={order?.accountOrderId||sessionId}/><Header pageSurface/><main className={s.wrap}>
    <Link href="/account" className={s.back}><ArrowLeft size={16} aria-hidden="true"/><Text>My account</Text></Link>
    <motion.div className={s.result} initial={reduced?false:{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.3}}>
      <section className={s.mainCard} aria-labelledby="purchase-title">
        <div className={s.heading} aria-live="polite"><span className={s.icon} data-ready={ready&&!error}><Check size={26} aria-hidden="true" style={{display:paid&&!error?'block':'none'}}/>{(!paid||error)&&<Smartphone size={26} aria-hidden="true"/>}</span><span className={s.eyebrow}><Text>Your MORROWGO connection</Text></span><h1 id="purchase-title"><Text>{title}</Text></h1><p className={s.intro}><Text>{description}</Text></p></div>
        {!error && !attention && <ConnectionSteps steps={[
          {label:'Payment',state:paid?'complete':'current'},
          {label:'eSIM ready',state:ready?'complete':paid?'current':'pending'},
          {label:sandbox?'Explore details':'Installation',state:ready?'current':'pending'}
        ]}/>}
        {sandbox&&<p className={s.sandbox}><span aria-hidden="true"/><Text>Sandbox mode · Test purchase only. This eSIM cannot be installed on a phone.</Text></p>}
        <div className={s.nextStep}>
          <div className={s.nextIcon}><Smartphone size={22} aria-hidden="true"/></div><div><h2><Text>{ready?'Your next step':attention?'We’re here to help':'What happens next?'}</Text></h2><p><Text>{ready?(sandbox?'View your test eSIM in My eSIMs.':'Open your eSIM and follow the installation guide.'):attention?'Contact support with your order reference.':'You can find your eSIM and its latest status in My eSIMs.'}</Text></p></div>
        </div>
        <div className={s.actions}><Link className={s.primary} href={attention&&!error?'/help#contact':installable&&!sandbox?installHref:'/account/esims'}><Text>{attention&&!error?'Contact support':installable&&!sandbox?'Open installation guide':'View my eSIM'}</Text><ArrowRight size={18} aria-hidden="true"/></Link><Link className={s.secondaryLink} href="/account"><Text>Back to account</Text></Link></div>
        <p className={s.keepNote}><Text>Your eSIM and installation details stay available in My eSIMs.</Text></p>
      </section>
      <aside className={s.summary} aria-label="Order summary"><span className={s.eyebrow}><Text>Your order</Text></span>{country&&<div className={s.destination}><span className={s.flag} aria-hidden="true">{countryFlag(order.iso)}</span><div><h2>{country}</h2><p>MORROWGO eSIM</p></div></div>}
        <dl className={s.details}><div><dt><Text>Payment</Text></dt><dd>{paid&&!error&&<Check size={14} aria-hidden="true"/>}<Text>{paid?(sandbox?'Test payment confirmed':'Confirmed'):error?'Not verified':'Checking'}</Text></dd></div><div><dt>eSIM</dt><dd><Text>{error?'Status unavailable':ready?'Ready':attention?'Needs attention':paid?'Preparing':'Waiting for payment'}</Text></dd></div>{total&&<div className={s.total}><dt><Text>Total</Text></dt><dd>{total}</dd></div>}</dl>
        <button className={s.refresh} disabled={checking||!/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)} onClick={onRefresh}>{checking&&<Loader2 size={14} aria-hidden="true"/>}<Text>{checking?'Checking status…':'Refresh order status'}</Text></button>
        {paused&&<p className={s.small}><Text>Automatic updates have paused. Refresh to check the latest status.</Text></p>}
        <Link href="/help#contact" className={s.supportLink}><Headphones size={17} aria-hidden="true"/><Text>Help with this order</Text><ArrowRight size={15} aria-hidden="true"/></Link>
      </aside>
    </motion.div>
    {(fields.length>0||/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId))&&<details className={s.technical}><summary><Text>Manual installation & order reference</Text><span>+</span></summary><div className={s.technicalBody}>
      {fields.length>0&&<section><h2><Text>Manual installation</Text></h2><p className={s.small}><Text>{sandbox?'These are test details and cannot install an eSIM.':'Use these details only if you prefer manual installation. Your QR code is available in My eSIMs.'}</Text></p><dl className={s.manualFields}>{fields.map(([key,value])=><div key={key}><dt><Text>{key==='smdpAddress'?'SM-DP+ address':key==='matchingId'?'Matching ID':'Activation code'}</Text></dt><dd><code>{value}</code><button className={s.copy} aria-label={`Copy ${key}`} onClick={()=>onCopyInstallation(value,key)}><Copy size={15} aria-hidden="true"/><Text>Copy</Text></button></dd></div>)}</dl></section>}
      {/^cs_(test|live)_[A-Za-z0-9]+$/.test(sessionId)&&<section><h2><Text>Order reference</Text></h2><p className={s.small}><Text>Share this reference with support if you need help.</Text></p><div className={s.reference}>{sessionId}</div><button className={s.copy} onClick={onCopyReference}><Copy size={15} aria-hidden="true"/><Text>Copy reference</Text></button></section>}
    </div></details>}
    <p className={s.feedback} role="status" aria-live="polite">{copied}</p>
  </main></div>;
}
