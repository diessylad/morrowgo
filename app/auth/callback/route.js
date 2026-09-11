import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '../../../lib/supabase/server';
import { safeAccountPath, siteOrigin } from '../../../lib/auth/config.mjs';
export const dynamic = 'force-dynamic';
export async function GET(request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  let path = '/login?message=link-invalid';
  if (code && code.length < 2048) {
    try {
      const client = createServerSupabaseClient();
      if (client) {
        const { error } = await client.auth.exchangeCodeForSession(code);
        if (!error) path = safeAccountPath(url.searchParams.get('next'));
      }
    } catch { /* Do not expose authentication errors or tokens. */ }
  }
  const response = NextResponse.redirect(new URL(path, siteOrigin()));
  response.headers.set('Cache-Control', 'private, no-store');
  response.headers.set('Referrer-Policy', 'no-referrer');
  return response;
}
