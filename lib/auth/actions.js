'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '../supabase/server';
import { safeAccountPath, siteOrigin, validEmail, validPassword, validRecoveryToken } from './config.mjs';

const unavailable = { error: 'Account access is not available yet. Please try again later. You can still explore plans without an account.' };
const field = (form, name) => typeof form.get(name) === 'string' ? form.get(name) : '';

export async function loginAction(previous, form) {
  const client = createServerSupabaseClient();
  if (!client) return unavailable;
  const email = field(form, 'email').trim();
  const password = field(form, 'password');
  if (!validEmail(email) || !password || password.length > 256) return { error: 'Enter your email and password.' };
  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.user?.email_confirmed_at) return { error: 'Unable to sign in. Check your email and password, and confirm your email first.' };
  } catch { return { error: 'Sign-in is temporarily unavailable. Please try again.' }; }
  redirect(safeAccountPath(field(form, 'next')));
}

export async function registerAction(previous, form) {
  const client = createServerSupabaseClient();
  if (!client) return unavailable;
  const email = field(form, 'email').trim();
  const password = field(form, 'password');
  if (!validEmail(email)) return { error: 'Enter a valid email address.' };
  if (!validPassword(password)) return { error: 'Use at least 12 characters, up to 72 bytes, for your password.' };
  try {
    const { error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: `${siteOrigin()}/auth/callback` } });
    if (error) return { error: 'Registration could not be completed. Try again later, or sign in if you already have an account.' };
    return { success: 'Check your inbox for a confirmation link. If this email already has an account, you can sign in or reset your password.' };
  } catch { return { error: 'Registration is temporarily unavailable. Please try again.' }; }
}

export async function forgotPasswordAction(previous, form) {
  const client = createServerSupabaseClient();
  if (!client) return unavailable;
  const email = field(form, 'email').trim();
  if (!validEmail(email)) return { error: 'Enter a valid email address.' };
  try { await client.auth.resetPasswordForEmail(email, { redirectTo: `${siteOrigin()}/auth/confirm?type=recovery` }); }
  catch { /* Uniform response avoids revealing whether an account exists. */ }
  return { success: 'If this email has an account, a password reset link will arrive shortly. Check your spam folder too.' };
}

export async function resetPasswordAction(previous, form) {
  const client = createServerSupabaseClient();
  if (!client) return unavailable;
  const token_hash = field(form, 'token_hash');
  if (!validRecoveryToken(token_hash)) return { error: 'Open a valid password reset link from your email first.' };
  const password = field(form, 'password');
  if (!validPassword(password)) return { error: 'Use at least 12 characters, up to 72 bytes, for your password.' };
  if (password !== field(form, 'confirmPassword')) return { error: 'The passwords do not match.' };
  try {
    const verified = await client.auth.verifyOtp({ token_hash, type: 'recovery' });
    if (verified.error) return { error: 'This reset link has expired or was already used. Request a new link.' };
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return { error: 'Your session could not be verified. Request a new reset link.' };
    const updated = await client.auth.updateUser({ password });
    if (updated.error) return { error: 'The password could not be changed. Request a new link and try another password.' };
    // Revoke refresh sessions after a password change; require a fresh sign-in.
    await client.auth.signOut({ scope: 'global' });
  } catch { return { error: 'Password reset is temporarily unavailable. Request a new link and try again.' }; }
  redirect('/login?message=password-updated');
}

export async function logoutAction() {
  const client = createServerSupabaseClient();
  if (client) {
    try { await client.auth.signOut({ scope: 'local' }); } catch { /* SDK clears local session on normal sign-out. */ }
  }
  redirect('/login');
}
