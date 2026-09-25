'use client';

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

function SocialOptions({ configured, message }) {
  const [failedProvider, setFailedProvider] = useState('');
  useEffect(() => {
    if (message !== 'oauth-failed') return;
    try { setFailedProvider(sessionStorage.getItem('morrowgo-auth-provider') || ''); }
    catch { /* Storage is optional; authentication does not depend on it. */ }
  }, [message]);
  return <div className={styles.social}>
    {['apple', 'google'].map(provider => <ProviderOption key={provider} provider={provider} configured={configured} callbackError={failedProvider === provider ? 'Sign-in was cancelled or could not be completed. Please try again.' : ''} />)}
    {message === 'oauth-failed' && !['apple', 'google'].includes(failedProvider) && <p className={styles.inlineError} role="alert">Sign-in could not be completed. Please try again.</p>}
  </div>;
}

function ProviderOption({ provider, configured, callbackError }) {
  const [state, action] = useFormState(oauthAction, {});
  const id = useId();
  const [attempted, setAttempted] = useState(false);
  const error = state.error || (!attempted && callbackError);
  return <form action={action} onSubmit={() => {
    setAttempted(true);
    try { sessionStorage.setItem('morrowgo-auth-provider', provider); } catch { /* Optional UI hint only. */ }
  }}>
    <SocialButton provider={provider} disabled={!configured} errorId={error ? id : undefined} />
    {error && <p id={id} className={styles.inlineError} role="alert">{error}</p>}
  </form>;
}

function SocialButton({ provider, disabled, errorId }) {
  const { pending } = useFormStatus();
  return <button type="submit" name="provider" value={provider} className={`${styles.socialButton} ${provider === 'apple' ? styles.appleButton : ''}`} disabled={disabled || pending} aria-describedby={errorId} aria-busy={pending}>
    <ProviderIcon provider={provider}/><span>{pending ? 'Please wait…' : `Continue with ${provider === 'apple' ? 'Apple' : 'Google'}`}</span>
  </button>;
}

function ResendConfirmation({ configured }) {
  const [state, action] = useFormState(resendConfirmationAction, {});
  return <details className={styles.resend}><summary>Resend confirmation email</summary>
    <form action={action} className={styles.form}>
      <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} required disabled={!configured} /></label>
      {state.error && <p className={styles.error} role="alert">{state.error}</p>}
      {state.success && <p className={styles.notice} role="status">{state.success}</p>}
      <Submit label="Send confirmation link" disabled={!configured} />
    </form>
  </details>;
}

const content = {
  login: { title: 'Welcome back.', description: 'Your travel connections, all in one place.', button: 'Sign in', action: loginAction },
  register: { title: 'Make yourself at home.', description: 'Create your MORROWGO account for your next journey.', button: 'Create account', action: registerAction },
  forgot: { title: 'Let’s get you back in.', description: 'Enter your email and we’ll send a password reset link.', button: 'Send reset link', action: forgotPasswordAction },
  reset: { title: 'A fresh start.', description: 'Choose a new password for your MORROWGO account.', button: 'Save new password', action: resetPasswordAction }
};

function Submit({ label, disabled }) {
  const { pending } = useFormStatus();
  return <button className={styles.submit} disabled={disabled || pending}>{pending ? 'Please wait…' : label}<span aria-hidden="true">↗</span></button>;
}

export default function AuthForm({ mode, configured, next = '/account', tokenHash = '', message = '', emailInitiallyOpen = false }) {
  const choosesMethod = ['login', 'register'].includes(mode);
  const [emailOpen, setEmailOpen] = useState(emailInitiallyOpen || (!choosesMethod) || ['password-updated', 'verified', 'link-invalid', 'email-change-pending'].includes(message));
  const emailRegionId = useId();
  const info = content[mode];
  const [state, action] = useFormState(info.action, {});
  const needsEmail = mode !== 'reset';
  const needsPassword = mode !== 'forgot';
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.brand}><img src="/icon.svg" width="24" height="24" alt=""/> MORROWGO</Link><Link href="/help">Help & support ↗</Link></header>
    <div className={styles.content}>

      <section className={styles.card} aria-labelledby="auth-heading"><p className={styles.eyebrow}>YOUR NEXT CONNECTION</p><h2 id="auth-heading">{info.title}</h2><p className={styles.description}>{info.description}</p>
        {!configured && <p className={styles.notice} role="status">Account access is being prepared. You can explore plans and use guest checkout while we finish setup.</p>}
        {message === 'password-updated' && <p className={styles.notice} role="status">Your password has been updated. Sign in with your new password.</p>}
        {message === 'verified' && <p className={styles.notice} role="status">Email confirmed. You can now sign in.</p>}
        {message === 'link-invalid' && <p className={styles.notice} role="alert">This link has expired, was already used, or could not be verified. If you already confirmed your email, sign in. Otherwise, resend your confirmation below. For password recovery, request a new reset link.</p>}
        {message === 'email-change-pending' && <p className={styles.notice} role="status">Check both your old and new inboxes to finish confirming your email change, then sign in.</p>}
        {choosesMethod && <><SocialOptions configured={configured} message={message} />
          <div className={styles.divider}><span>or</span></div>
          <button type="button" className={styles.socialButton} aria-expanded={emailOpen} aria-controls={emailRegionId} onClick={() => setEmailOpen(open => !open)}><ProviderIcon provider="email"/><span>Continue with Email</span></button>
        </>}
        <div id={emailRegionId} className={choosesMethod ? styles.emailReveal : undefined} data-open={emailOpen} aria-hidden={!emailOpen} inert={!emailOpen ? '' : undefined}><div className={styles.emailRevealInner}>
        {mode === 'reset' && !tokenHash && <p className={styles.notice}>Open the reset link from your email to continue.</p>}
        <form action={action} className={styles.form}>
          <input type="hidden" name="next" value={next} />
          {mode === 'reset' && <input type="hidden" name="token_hash" value={tokenHash} />}
          {needsEmail && <label>Email address<input name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@example.com" required disabled={!configured} /></label>}
          {needsPassword && <label>{mode === 'reset' ? 'New password' : 'Password'}<input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? 1 : 12} maxLength={72} required disabled={!configured} />{mode !== 'login' && <small>At least 12 characters. Use a unique password.</small>}</label>}
          {mode === 'reset' && <label>Confirm new password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={72} required disabled={!configured} /></label>}
          {mode === 'login' && <Link href="/forgot-password" className={styles.forgot}>Forgot password?</Link>}
          {state.error && <p className={styles.error} role="alert">{state.error}</p>}
          {state.success && <p className={styles.notice} role="status">{state.success}</p>}
          <Submit label={info.button} disabled={!configured || (mode === 'reset' && !tokenHash)} />
        </form>
        </div></div>
        <p className={styles.switch}>{mode === 'login' ? <>New to MORROWGO? <Link href={emailOpen ? `/register?method=email&next=${encodeURIComponent(next)}` : '/register'}>Create an account</Link></> : mode === 'register' ? <>Already have an account? <Link href={emailOpen ? `/login?method=email&next=${encodeURIComponent(next)}` : '/login'}>Sign in</Link></> : <Link href={mode === 'reset' ? '/forgot-password' : '/login'}>{mode === 'reset' ? 'Request a new reset link' : 'Back to sign in'}</Link>}</p>
        {choosesMethod && emailOpen && <ResendConfirmation configured={configured} />}
        {mode === 'register' && <p className={styles.fine}>We’ll ask you to confirm your email before you access your account.</p>}
      </section>
    </div>
    <footer className={styles.footer}><span>Real eSIM delivery is currently disabled during pre-launch.</span><Link href="/destinations">Explore destinations ↗</Link></footer>
  </main>;
}
