'use server';
import en from './../../locales/en.json';

import { redirect } from 'next/navigation';
import { isOAuthProviderEnabled } from './providers';
import { createServerSupabaseClient, clearAuthCookies } from '../supabase/server';
import { safeAccountPath, siteOrigin, validEmail, validPassword, validRecoveryToken } from './config.mjs';

const unavailable = { error: en["m_aefe58dc8261"] };
const field = (form, name) => typeof form.get(name) === 'string' ? form.get(name) : '';

export async function loginAction(previous, form) {
  const client = createServerSupabaseClient();
  if (!client) return unavailable;
  const email = field(form, 'email').trim();
  const password = field(form, 'password');
  if (!validEmail(email) || !password || password.length > 256) return { error: en["m_5453c55bdbb1"] };
  try {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error || !data.user?.email_confirmed_at) return { error: en["m_5e567eaa92bc"] };
  } catch { return { error: en["m_656b6535d6cc"] }; }
  redirect(safeAccountPath(field(form, 'next')));
}

export async function registerAction(previous, form) {
  const client = createServerSupabaseClient();
  if (!client) return unavailable;
  const email = field(form, 'email').trim();
  const password = field(form, 'password');
  if (!validEmail(email)) return { error: en["m_2e09edea513a"] };
  if (!validPassword(password)) return { error: en["m_ee6374b224d7"] };
  try {
    const { error } = await client.auth.signUp({ email, password, options: { emailRedirectTo: `${siteOrigin()}/auth/confirm?next=${encodeURIComponent(safeAccountPath(field(form, 'next')))}` } });
    if (error) return { error: en["m_b650a2975d86"] };
    return { success: en["m_1e146eef1257"] };
  } catch { return { error: en["m_25b389e18527"] }; }
}

export async function forgotPasswordAction(previous, form) {
  const client = createServerSupabaseClient();
  if (!client) return unavailable;
  const email = field(form, 'email').trim();
  if (!validEmail(email)) return { error: en["m_2e09edea513a"] };
  try { await client.auth.resetPasswordForEmail(email, { redirectTo: `${siteOrigin()}/auth/confirm?type=recovery` }); }
  catch { /* Uniform response avoids revealing whether an account exists. */ }
  return { success: en["m_5853ae8c9bd9"] };
}

export async function resetPasswordAction(previous, form) {
  const client = createServerSupabaseClient();
  if (!client) return unavailable;
  const token_hash = field(form, 'token_hash');
  if (!validRecoveryToken(token_hash)) return { error: en["m_7e041cfe8492"] };
  const password = field(form, 'password');
  if (!validPassword(password)) return { error: en["m_ee6374b224d7"] };
  if (password !== field(form, 'confirmPassword')) return { error: en["m_540a66f4276c"] };
  try {
    const verified = await client.auth.verifyOtp({ token_hash, type: 'recovery' });
    if (verified.error) return { error: en["m_8b138af8f82d"] };
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return { error: en["m_d98d37e1f7a0"] };
    const updated = await client.auth.updateUser({ password });
    if (updated.error) return { error: en["m_30c18bb67327"] };
    // Request refresh-session revocation; the password has already changed.
    // A revocation outage must not incorrectly tell the customer that the reset failed.
    try { await client.auth.signOut({ scope: 'global' }); }
    catch { /* Local credentials are still cleared below. */ }
    finally { clearAuthCookies(); }
  } catch { return { error: en["m_7873358bc96f"] }; }
  redirect('/login?message=password-updated');
}

export async function logoutAction() {
  const client = createServerSupabaseClient();
  if (client) {
    try { await client.auth.signOut({ scope: 'local' }); } catch { /* SDK clears local session on normal sign-out. */ }
  }
  clearAuthCookies();
  redirect('/login');
}

export async function resendConfirmationAction(previous, form) {
  const client = createServerSupabaseClient();
  if (!client) return unavailable;
  const email = field(form, 'email').trim();
  if (!validEmail(email)) return { error: en["m_2e09edea513a"] };
  try {
    await client.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${siteOrigin()}/auth/confirm?next=${encodeURIComponent(safeAccountPath(field(form, 'next')))}` } });
  } catch { /* Uniform result prevents account enumeration, including already-confirmed accounts. */ }
  return { success: en["m_49f861154d6b"] };
}

export async function oauthAction(previous, form) {
  const provider = field(form, 'provider');
  if (!['apple', 'google'].includes(provider)) return { error: en["m_a9870cf1385e"] };
  const client = createServerSupabaseClient();
  if (!client) return unavailable;
  if (!await isOAuthProviderEnabled(provider)) return { error: en["m_38f0b9aeb0f3"] };
  let destination;
  try {
    const { data, error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${siteOrigin()}/auth/callback?next=${encodeURIComponent(safeAccountPath(field(form, 'next')))}`, skipBrowserRedirect: true }
    });
    if (error || !data?.url) return { error: en["m_38f0b9aeb0f3"] };
    destination = data.url;
  } catch { return { error: en["m_38f0b9aeb0f3"] }; }
  // Next.js redirects throw; keep the redirect outside the error handler.
  redirect(destination);
}
