import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getAuthConfig } from './lib/auth/config.mjs';

export async function middleware(request) {
  let response = NextResponse.next({ request });
  const config = getAuthConfig();
  if (config) {
    const client = createServerClient(config.url, config.key, {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(values) {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          values.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        }
      }
    });
    try { await client.auth.getUser(); } catch { /* Routes handle unavailable authentication safely. */ }
  }
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = { matcher: ['/account/:path*', '/api/account/:path*', '/login', '/register', '/forgot-password', '/reset-password', '/auth/:path*'] };
