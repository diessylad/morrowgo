import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../lib/supabase/server';
import { safeAccountPath, siteOrigin, validRecoveryToken } from '../../../lib/auth/config.mjs';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  let path = '/login?message=link-invalid';
  if (validRecoveryToken(token_hash)) {
    if (type === 'recovery') {
      // The one-time token is consumed only on password submission, not by link scanners.
      path = `/reset-password?token_hash=${encodeURIComponent(token_hash)}`;
    } else if (['signup', 'email_change'].includes(type)) {
      const client = createServerSupabaseClient();
      try {
        if (client) {
          const { error } = await client.auth.verifyOtp({ token_hash, type });
          if (!error) path = safeAccountPath(url.searchParams.get('next'));
        }
      } catch { /* Fail closed with a generic message. */ }
    }
  }
  const response = NextResponse.redirect(new URL(path, siteOrigin()));
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
