'use client';
import { Text, Localized, AuthInput } from './../i18n/Provider';
import en from './../../locales/en.json';
import LanguageSelect from '../i18n/LanguageSelect';
import { ArrowRight } from 'lucide-react';

import Link from 'next/link';
import { useEffect, useId, useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { loginAction, registerAction, forgotPasswordAction, resetPasswordAction, oauthAction, resendConfirmationAction } from '../../lib/auth/actions';
import styles from './auth.module.css';


function ProviderIcon({ provider }) {
  if (provider === 'apple') return <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M17.05 12.54c.03 3.22 2.82 4.29 2.85 4.3-.02.08-.45 1.53-1.47 3.03-.89 1.29-1.81 2.58-3.26 2.61-1.42.03-1.88-.84-3.51-.84-1.63 0-2.14.81-3.49.87-1.4.05-2.46-1.4-3.36-2.68-1.83-2.64-3.23-7.46-1.35-10.72.93-1.62 2.59-2.65 4.39-2.68 1.37-.03 2.66.92 3.5.92.84 0 2.42-1.14 4.07-.97.69.03 2.64.28 3.9 2.12-.1.06-2.33 1.36-2.3 4.04ZM14.37 4.61c.75-.91 1.26-2.18 1.12-3.44-1.08.04-2.4.72-3.18 1.63-.7.8-1.31 2.09-1.15 3.32 1.2.09 2.44-.61 3.21-1.51Z"/></svg>;
  if (provider === 'google') return <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.61 24.46c0-1.36-.12-2.66-.35-3.92H24v7.42h11a9.4 9.4 0 0 1-4.08 6.17v5.13h6.61c3.87-3.57 6.08-8.83 6.08-14.8Z"/><path fill="#34A853" d="M24 44c5.51 0 10.13-1.83 13.51-4.96l-6.61-5.13c-1.83 1.23-4.17 1.98-6.9 1.98-5.31 0-9.82-3.58-11.43-8.4H5.75v5.29A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.57 27.49a12 12 0 0 1 0-7.65v-5.29H5.75a20 20 0 0 0 0 18.23l6.82-5.29Z"/><path fill="#EA4335" d="M24 11.44c3 0 5.68 1.03 7.8 3.05l5.85-5.85C34.11 5.34 29.51 3.33 24 3.33A20 20 0 0 0 5.75 14.55l6.82 5.29c1.61-4.82 6.12-8.4 11.43-8.4Z"/></svg>;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/></svg>;
}

function SocialOptions({ configured, message, next }) {
  const [failedProvider, setFailedProvider] = useState('');
  useEffect(() => {
    if (message !== 'oauth-failed') return;
    try { setFailedProvider(sessionStorage.getItem('morrowgo-auth-provider') || ''); }
    catch { /* Storage is optional; authentication does not depend on it. */ }
  }, [message]);
  return <div className={styles.social}>
    <Text>{['apple', 'google'].map(provider => <ProviderOption key={provider} provider={provider} next={next} configured={configured} callbackError={failedProvider === provider ? en["m_1b388e6dd1bb"] : ''} />)}</Text>
    <Text>{message === 'oauth-failed' && !['apple', 'google'].includes(failedProvider) && <p className={styles.inlineError} role="alert"><Text>{en["m_880569a7b5f8"]}</Text></p>}</Text>
  </div>;
}

function ProviderOption({ provider, configured, callbackError, next }) {
  const [state, action] = useFormState(oauthAction, {});
  const id = useId();
  const [attempted, setAttempted] = useState(false);
  const error = state.error || (!attempted && callbackError);
  return <form action={action} onSubmit={() => {
    setAttempted(true);
    try { sessionStorage.setItem('morrowgo-auth-provider', provider); } catch { /* Optional UI hint only. */ }
  }}>
    <input type="hidden" name="next" value={next} />
    <SocialButton provider={provider} disabled={!configured} errorId={error ? id : undefined} />
    <Text>{error && <p id={id} className={styles.inlineError} role="alert"><Text>{error}</Text></p>}</Text>
  </form>;
}

function SocialButton({ provider, disabled, errorId }) {
  const { pending } = useFormStatus();
  return <button type="submit" name="provider" value={provider} className={`${styles.socialButton} ${provider === 'apple' ? styles.appleButton : ''}`} disabled={disabled || pending} aria-describedby={errorId} aria-busy={pending}>
    <ProviderIcon provider={provider}/><span><Text>{pending ? en["m_5afeca73bef6"] : `Continue with ${provider === 'apple' ? 'Apple' : 'Google'}`}</Text></span><ArrowRight size={19} aria-hidden="true"/>
  </button>;
}

function ResendConfirmation({ configured, next }) {
  const [state, action] = useFormState(resendConfirmationAction, {});
  return <details className={styles.resend}><summary><Text>{en["m_0807f4650e74"]}</Text></summary>
    <form action={action} className={styles.form}>
      <input type="hidden" name="next" value={next} />
      <label><Text>{en["m_c94d3175a656"]}</Text><AuthInput name="email" type="email" autoComplete="email" maxLength={254} required disabled={!configured} /></label>
      <Text>{state.error && <p className={styles.error} role="alert"><Text>{state.error}</Text></p>}</Text>
      <Text>{state.success && <p className={styles.notice} role="status"><Text>{state.success}</Text></p>}</Text>
      <Submit label={en["m_796ce9f7adc5"]} disabled={!configured} />
    </form>
  </details>;
}

const content = {
  login: { title: en["m_4308f5ef22c9"], description: en["m_318664d58b10"], button: en["m_ada2e9e96fa9"], action: loginAction },
  register: { title: en["m_3ea2e21a30d8"], description: en["m_b3884184cea4"], button: en["m_aaf374479756"], action: registerAction },
  forgot: { title: en["m_53cefc8fd5bd"], description: en["m_939c8b43bbc5"], button: en["m_b8ec554332fc"], action: forgotPasswordAction },
  reset: { title: en["m_91fe01b7de7b"], description: en["m_327f53ea871c"], button: en["m_2a76cbea1f46"], action: resetPasswordAction }
};

function Submit({ label, disabled }) {
  const { pending } = useFormStatus();
  return <button className={styles.submit} disabled={disabled || pending}><Text>{pending ? en["m_5afeca73bef6"] : label}</Text><span aria-hidden="true">↗</span></button>;
}

export default function AuthForm({ mode, configured, next = '/account', tokenHash = '', message = '', emailInitiallyOpen = false }) {
  const choosesMethod = ['login', 'register'].includes(mode);
  const [emailOpen, setEmailOpen] = useState(emailInitiallyOpen || (!choosesMethod) || ['password-updated', 'verified', 'link-invalid', 'email-change-pending'].includes(message));
  const emailRegionId = useId();
  const info = content[mode];
  const [state, action] = useFormState(info.action, {});
  const needsEmail = mode !== 'reset';
  const needsPassword = mode !== 'forgot';
  return <div className={styles.shell}>
    <aside className={styles.visual} aria-label="MORROWGO — Your world. Connected.">
      <img src="/brand/morrowgo-auth-left-panel-small-esim.png" alt="" className={styles.visualImage} />
    </aside>
    <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.mobileBrand} aria-label="MORROWGO home"><span className={styles.brandMark} aria-hidden="true"><i/><i/><i/><i/></span>MORROWGO</Link><Link href="/"><span aria-hidden="true">←</span> <Text>Back to site</Text></Link><LanguageSelect /></header>
    <div className={styles.content}>

      <section className={styles.card} aria-labelledby="auth-heading"><p className={styles.eyebrow}><Text>{en["m_a3399006beae"]}</Text></p><h2 id="auth-heading"><Text>{info.title}</Text></h2><p className={styles.description}><Text>{mode === 'login' ? 'Your eSIMs. Your trips. One place.' : info.description}</Text></p>
        <Text>{!configured && <p className={styles.notice} role="status"><Text>{en["m_a448b17d7689"]}</Text></p>}</Text>
        {message === 'session-expired' && <p className={styles.notice} role="status"><Text>Your session has expired. Please sign in again.</Text></p>}
        <Text>{message === 'password-updated' && <p className={styles.notice} role="status"><Text>{en["m_873031daedd0"]}</Text></p>}</Text>
        <Text>{message === 'verified' && <p className={styles.notice} role="status"><Text>{en["m_c83fef6d7600"]}</Text></p>}</Text>
        <Text>{message === 'link-invalid' && <p className={styles.notice} role="alert"><Text>{en["m_496a35e3ae61"]}</Text></p>}</Text>
        <Text>{message === 'email-change-pending' && <p className={styles.notice} role="status"><Text>{en["m_95d657505b4d"]}</Text></p>}</Text>
        <Text>{choosesMethod && <><SocialOptions configured={configured} message={message} next={next} />
          <div className={styles.divider}><span><Text>{en["m_1758356db217"]}</Text></span></div>
          <button type="button" className={styles.socialButton} aria-expanded={emailOpen} aria-controls={emailRegionId} onClick={() => setEmailOpen(open => !open)}><ProviderIcon provider="email"/><span><Text>{en["m_88001457548e"]}</Text></span><ArrowRight size={19} aria-hidden="true"/></button>
        </>}</Text>
        <div id={emailRegionId} className={choosesMethod ? styles.emailReveal : undefined} data-open={emailOpen} aria-hidden={!emailOpen} inert={!emailOpen ? '' : undefined}><div className={styles.emailRevealInner}>
        <Text>{mode === 'reset' && !tokenHash && <p className={styles.notice}><Text>{en["m_af24ce9cc497"]}</Text></p>}</Text>
        <form action={action} className={styles.form}>
          <input type="hidden" name="next" value={next} />
          <Text>{mode === 'reset' && <input type="hidden" name="token_hash" value={tokenHash} />}</Text>
          <Text>{needsEmail && <label><Text>{en["m_c94d3175a656"]}</Text><AuthInput name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required disabled={!configured} /></label>}</Text>
          <Text>{needsPassword && <label><Text>{mode === 'reset' ? en["m_d850ee188c7c"] : en["m_8be3c943b160"]}</Text><AuthInput name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? 1 : 12} maxLength={72} required disabled={!configured} /><Text>{mode !== 'login' && <small><Text>{en["m_7fce2cf23794"]}</Text></small>}</Text></label>}</Text>
          <Text>{mode === 'reset' && <label><Text>{en["m_f85039fd8e49"]}</Text><AuthInput name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={72} required disabled={!configured} /></label>}</Text>
          <Text>{mode === 'login' && <Link href="/forgot-password" className={styles.forgot}><Text>{en["m_4c29f7f03358"]}</Text></Link>}</Text>
          <Text>{state.error && <p className={styles.error} role="alert"><Text>{state.error}</Text></p>}</Text>
          <Text>{state.success && <p className={styles.notice} role="status"><Text>{state.success}</Text></p>}</Text>
          <Submit label={info.button} disabled={!configured || (mode === 'reset' && !tokenHash)} />
        </form>
        </div></div>
        <p className={styles.switch}><Text>{mode === 'login' ? <><Text>{en["m_8e6d90e912f1"]}</Text><Link href={emailOpen ? `/register?method=email&next=${encodeURIComponent(next)}` : `/register?next=${encodeURIComponent(next)}`}><Text>{en["m_3f4f547d7364"]}</Text></Link></> : mode === 'register' ? <><Text>{en["m_e41e4c6deeb8"]}</Text><Link href={emailOpen ? `/login?method=email&next=${encodeURIComponent(next)}` : `/login?next=${encodeURIComponent(next)}`}><Text>{en["m_ada2e9e96fa9"]}</Text></Link></> : <Link href={mode === 'reset' ? '/forgot-password' : '/login'}><Text>{mode === 'reset' ? en["m_4857497af317"] : en["m_4da821676b2f"]}</Text></Link>}</Text></p>
        <Text>{choosesMethod && emailOpen && <ResendConfirmation configured={configured} next={next} />}</Text>
        <Text>{mode === 'register' && <p className={styles.fine}><Text>{en["m_d79729666dff"]}</Text></p>}</Text>
      </section>
    </div>
    <footer className={styles.footer}><span><Text>Terms</Text></span><span aria-hidden="true">·</span><span><Text>Privacy</Text></span></footer>
  </main></div>;
}
