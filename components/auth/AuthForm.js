'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { loginAction, registerAction, forgotPasswordAction, resetPasswordAction } from '../../lib/auth/actions';
import styles from './auth.module.css';

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

export default function AuthForm({ mode, configured, next = '/account', tokenHash = '', message = '' }) {
  const info = content[mode];
  const [state, action] = useFormState(info.action, {});
  const needsEmail = mode !== 'reset';
  const needsPassword = mode !== 'forgot';
  return <main className={styles.page}>
    <header className={styles.header}><Link href="/" className={styles.brand}>MORROWGO</Link><Link href="/help">Help & support ↗</Link></header>
    <div className={styles.content}>
      <section className={styles.intro}><p className={styles.eyebrow}>MY MORROWGO</p><h1>More travel.<br /><span>Less to think about.</span></h1><p>A personal space for your eSIMs, orders and the journeys ahead.</p><Link href="/demo/account" className={styles.preview}>Explore a demo account ↗</Link></section>
      <section className={styles.card} aria-labelledby="auth-heading"><p className={styles.eyebrow}>YOUR NEXT CONNECTION</p><h2 id="auth-heading">{info.title}</h2><p className={styles.description}>{info.description}</p>
        {!configured && <p className={styles.notice} role="status">Account access is being prepared. You can explore plans and use guest checkout while we finish setup.</p>}
        {message === 'password-updated' && <p className={styles.notice} role="status">Your password has been updated. Sign in with your new password.</p>}
        {message === 'verified' && <p className={styles.notice} role="status">Email confirmed. You can now sign in.</p>}
        {message === 'link-invalid' && <p className={styles.notice} role="alert">This email link has expired or is invalid. Request a new reset link or try signing in.</p>}
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
        <p className={styles.switch}>{mode === 'login' ? <>New to MORROWGO? <Link href="/register">Create an account</Link></> : mode === 'register' ? <>Already have an account? <Link href="/login">Sign in</Link></> : <Link href={mode === 'reset' ? '/forgot-password' : '/login'}>{mode === 'reset' ? 'Request a new reset link' : 'Back to sign in'}</Link>}</p>
        {mode === 'register' && <p className={styles.fine}>We’ll ask you to confirm your email before you access your account.</p>}
      </section>
    </div>
    <footer className={styles.footer}><span>Real eSIM delivery is currently disabled during pre-launch.</span><Link href="/destinations">Explore destinations ↗</Link></footer>
  </main>;
}
