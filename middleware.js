import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { verifySessionLifetime, expireLocalSession } from './lib/auth/lifetime.mjs';
import { getAuthConfig } from './lib/auth/config.mjs';

export async function middleware(request) {
  let response = NextResponse.next({ request });
  const config = getAuthConfig();
  let verifiedUser = null;
  let expired = false;
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
    try { const {data,error} = await client.auth.getUser(); if(!error && data?.user?.email_confirmed_at) {
      if (await verifySessionLifetime(client, data.user.id)) verifiedUser = data.user;
      else { expired = true; await expireLocalSession(client); }
    } } catch { /* Routes handle unavailable authentication safely. */ }
  }
  if (['/account', '/profile', '/dashboard', '/checkout'].some(path => request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')) && !verifiedUser) {
    const login = new URL('/login', request.url);
    if (expired) login.searchParams.set('message', 'session-expired');
    login.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
    const redirected = NextResponse.redirect(login);
    response.cookies.getAll().forEach(cookie => redirected.cookies.set(cookie));
    redirected.headers.set('Cache-Control','private, no-store');
    return redirected;
  }
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  response.headers.set('Referrer-Policy', 'no-referrer');
  response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  return response;
}

export const config = { matcher: ['/profile/:path*', '/dashboard/:path*', '/checkout/:path*', '/account/:path*', '/api/account/:path*', '/login', '/register', '/forgot-password', '/reset-password', '/auth/:path*'] };
