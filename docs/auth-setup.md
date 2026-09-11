# My MORROWGO authentication setup

The site remains usable without Supabase configuration. Account forms are disabled with a setup notice, protected pages redirect to sign-in, and account APIs fail closed. Guest checkout, Redis orders, Stripe verification and fulfillment flags are unchanged.

## Supabase and Vercel

1. Create a Supabase project. Enable email/password authentication and **Confirm email**. Do not disable email confirmation. Use a production SMTP service in Supabase Auth settings; the website only adds public mail links and does not create mailboxes or configure delivery.
2. Apply the SQL migration in `supabase/migrations/` using the project's SQL editor or migration CLI. Customer tables allow only owner reads. See `account-data.md` for private supplier storage and future order linking.
3. Add these environment variables in Vercel for the intended deployment environment:
   - `NEXT_PUBLIC_SUPABASE_URL`: the Supabase project URL.
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: project publishable key. A legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported if no publishable key is set.
   - `NEXT_PUBLIC_SITE_URL`: `https://www.morrowgo.com` for production; use the exact preview/local origin in other environments.
4. Never expose a service-role key, SMTP password or database password using a `NEXT_PUBLIC_` name. No service-role key is needed by this application. Keep existing Stripe, Redis and supplier variables unchanged.
5. Use Node.js 22 or newer in Vercel (Supabase SDK requirement). Dependencies are locked in `pnpm-lock.yaml`. Next.js was updated within the existing 14.x line from 14.2.15 to 14.2.35 for its published security patch.
6. Set Supabase Auth Site URL to `https://www.morrowgo.com`. Allow exact redirect URLs `/auth/callback` and `/auth/confirm?type=recovery` on that origin. Add local/preview origins individually for testing; avoid broad production wildcards. Redeploy after setting public environment variables.

## Email templates — required

Use these links in Supabase Auth's email templates. `SiteURL` must match the deployment being tested. Configure a separate test project or change templates appropriately for preview environments.

Confirm signup:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm your email</a>
```

Reset password:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Reset your password</a>
```

The custom reset template is required. Its single-use recovery token is verified on password submission. Opening/scanning the recovery link alone does not consume it. Links/tokens must not be copied into support requests or analytics. Auth routes send no-store and no-referrer headers. PKCE callback is also available for Supabase's standard signup confirmation flow.

## Behavior and deployment checks

- `/register`: email and password; confirm the received email before account access.
- `/login`: sign in; middleware refreshes the Supabase cookie session. Server authorization calls `auth.getUser()` and checks confirmed email; it never trusts a client-supplied user ID or an unverified cached session.
- `/forgot-password` and `/reset-password`: request and use a one-time email link, then sign in with the new password. Password changes revoke refresh sessions; already issued access tokens can remain valid until their normal expiry.
- Sign out: clears this browser's Supabase session. Server actions use Next.js same-origin action protection. Passwords go to Supabase via the server SDK and are never stored in MORROWGO tables or Redis.
- `/account`, `/account/esims`, `/account/orders`, `/account/settings`: owner-only account views. `/demo/account` is clearly labeled sample data and requires no login.
- Do a real confirmation/reset-email test after SMTP and credentials are configured. Verify persistence after refresh, sign-out, expired links, two separate customers, and missing/invalid sessions. Local mocks cannot prove SMTP delivery or the hosted project's settings.
- Keep built-in Supabase signup/login/email rate limits enabled. Configure abuse controls appropriate for public launch (including CAPTCHA if needed).

Public customer contact is `support@morrowgo.com`; general enquiries use `hello@morrowgo.com`. Test sending and receiving at those mailboxes separately with the domain/email provider. Merely displaying a mailto link does not create a mailbox.
