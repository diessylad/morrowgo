# MORROWGO authentication — production setup

## Implementation and inspected state

Next.js 14 server actions use `@supabase/ssr` cookie sessions. Middleware refreshes sessions; `/account` and account APIs use server-verified `getUser()` plus confirmed email. No client-provided identity authorizes an account. Existing account UI and checkout are unchanged.

Project inspected on 2026-09-25: MORROWGO, `pxqhrhgplknkybaxhzfj`, URL `https://pxqhrhgplknkybaxhzfj.supabase.co`. Public Auth settings returned email enabled, confirmation required, signups enabled, Google disabled, Apple disabled. Private Site URL/allowlist, installed email templates, SMTP and provider credentials could not be read through the available connector. They have NOT been changed by this implementation.

Two callbacks exist:
- `/auth/callback`: PKCE code exchange for Google/Apple and legacy same-browser signup confirmations. The exchange must return a session and confirmed user. Errors become a friendly login message, never raw provider details.
- `/auth/confirm`: validates email token hashes for `signup`/`email`, `recovery`, and `email_change`. Signup establishes cookies and redirects to `/account`, including when opened on another device. Secure email change can require both inbox confirmations; the first confirmation gets an explanatory message. Recovery redirects to `/reset-password`; its token is consumed only when the new password is submitted, so email scanners do not consume the reset link on GET.

The old signup flow depended on a PKCE verifier stored in the initiating browser. Opening the email in another browser/device can verify the email but fail the session exchange. Default recovery email links also do not match the token-hash reset implementation. Install the templates below to fix both paths. Used/expired links offer sign-in, resend confirmation, or a new reset link rather than exposing backend errors. An already-confirmed customer signs in normally; resending does not disclose whether an account exists.

## 1. Supabase URL configuration — manual

Authentication → URL Configuration:

**Site URL**
```
https://www.morrowgo.com
```

**Redirect URLs** (exact entries used by the actions):
```
https://www.morrowgo.com/auth/callback
https://www.morrowgo.com/auth/confirm?type=recovery
```

The custom email templates link directly to `/auth/confirm?token_hash=…&type=signup`, `recovery`, or `email_change` using `.SiteURL`; these are incoming verification links, not additional `redirectTo` allowlist entries. Do not add token wildcards. The signup/resend action retains `/auth/callback` as `emailRedirectTo` for legacy standard email links. Final redirects permit only `/account` and its simple subpaths.

Production application environment:
```
NEXT_PUBLIC_SITE_URL=https://www.morrowgo.com
NEXT_PUBLIC_SUPABASE_URL=https://pxqhrhgplknkybaxhzfj.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<project publishable key>
```
Legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains supported. Use the same project on server and browser. Provider secrets and SMTP credentials belong in Supabase settings, never `NEXT_PUBLIC_*`, the repository, or browser bundles. Normal customer authentication does not require a service-role key; leave unrelated existing private integrations unchanged.

Production redirects are pinned to `https://www.morrowgo.com` even if `NEXT_PUBLIC_SITE_URL` is accidentally localhost. Only `NODE_ENV=development` (and not `VERCEL_ENV=production`) permits an explicit local origin. Use `npm run dev`, not `next start`, for local email/OAuth testing. `next start` intentionally uses the production redirect policy.

For local development on port 3000, set `NEXT_PUBLIC_SITE_URL=http://localhost:3000` and add exact entries to the TEST project's allowlist:
```
http://localhost:3000/auth/callback
http://localhost:3000/auth/confirm?type=recovery
```
Use the actual port consistently. Do not mix `localhost` and `127.0.0.1`: they have different cookies. Email templates use `.SiteURL`, so a separate test project with local Site URL is recommended for local email testing. Do not set the production project's Site URL to localhost. Avoid broad production/preview wildcards.

## 2. Custom SMTP and DNS — manual

Authentication → Email / SMTP settings:
- Enable Custom SMTP using your selected transactional mail provider.
- Sender name: **MORROWGO**.
- Sender email: **no-reply@auth.morrowgo.com**.
- Enter provider-issued SMTP host, port, username and password in Supabase only. Use the provider's supported secure connection settings.
- Verify the sending domain `auth.morrowgo.com` with the provider first.
- Publish the provider's exact DKIM records and SPF/MAIL FROM records in DNS. Do not guess record values or add multiple SPF records at the same name. Configure aligned DMARC after inspecting the existing domain policy; the provider supplies the required DKIM/SPF details.
- Disable link/click tracking for authentication mail so verification URLs are not rewritten. Verify delivery to Gmail, Outlook and Apple relay addresses, inbox placement, and SPF/DKIM/DMARC results in received message headers.
- Keep confirmation enabled. Configure rate limits, SMTP send limits, and abuse protection for expected launch traffic. Resend/reset UI responses intentionally avoid disclosing account existence; delivery failure/rate limiting must be monitored in Supabase and the SMTP provider.

The mailbox name does not itself configure SMTP or a Supabase custom Auth domain. `auth.morrowgo.com` is the requested mail sender domain here; OAuth currently uses the inspected `supabase.co` project host.

## 3. Install branded email templates — manual, required

Paste these complete HTML files into Authentication → Email Templates:

| Supabase template | Source file | Subject |
|---|---|---|
| Confirm signup | `supabase/email-templates/confirm-signup.html` | Confirm your email · MORROWGO |
| Reset password | `supabase/email-templates/reset-password.html` | Reset your password · MORROWGO |
| Change email address | `supabase/email-templates/change-email.html` | Confirm your email change · MORROWGO |

They use supported `.SiteURL` and `.TokenHash`; change email also uses `.NewEmail`. There are no remote fonts/images or visible Supabase branding. Set Site URL before sending. Do not substitute `.ConfirmationURL` in the recovery template: the reset action deliberately verifies the recovery hash on submission. Keep secure email change enabled. No new account/settings UI is introduced.

## 4. Google Cloud and Supabase — manual

1. Create/select a Google Cloud project. In Google Auth Platform configure Branding as MORROWGO, support/developer contacts, verified `morrowgo.com` domain, homepage `https://www.morrowgo.com`, and the site's actual published privacy/terms URLs. Configure an External audience for public customers; add owned test users while testing and publish the app before launch. Complete Google's requested brand/domain verification.
2. Request only `openid`, `https://www.googleapis.com/auth/userinfo.email`, and `https://www.googleapis.com/auth/userinfo.profile`.
3. Create an OAuth client of type **Web application**. Authorized JavaScript origin: `https://www.morrowgo.com`.
4. Authorized redirect URI (Google → Supabase):
```
https://pxqhrhgplknkybaxhzfj.supabase.co/auth/v1/callback
```
5. Supabase → Authentication → Sign In / Providers → Google: enable and paste the Client ID and Client Secret. Do not put them in website source. Keep nonce checks enabled.
6. Supabase returns to `https://www.morrowgo.com/auth/callback`, which saves SSR cookies and redirects to `/account`. This MORROWGO URL is the Supabase redirect allowlist entry; it is NOT Google's authorized redirect URI.

One flow handles new and returning users. Supabase manages verified identity linking; the app does not merge accounts by email itself. Test the same confirmed email across email/password and Google, plus a fresh Google account. Existing identities with different emails are not automatically the same account.

## 5. Apple Developer and Supabase — manual

1. Use an active Apple Developer membership. Record Team ID. Create/select a primary App ID with **Sign in with Apple** enabled.
2. Create a **Services ID** for web sign-in (for example `com.morrowgo.web`, only if available in your team). Enable Sign in with Apple and associate it with the primary App ID.
3. Services ID → Website URLs: domain `pxqhrhgplknkybaxhzfj.supabase.co`; Return URL:
```
https://pxqhrhgplknkybaxhzfj.supabase.co/auth/v1/callback
```
4. Create a Sign in with Apple signing key; retain its Key ID and download the `.p8` key securely. Generate Apple's client-secret JWT using Team ID, Key ID, Services ID and that signing key (Supabase's Apple setup guide includes a local browser generator). Never commit the `.p8` or generated secret.
5. Supabase → Authentication → Sign In / Providers → Apple: enable, enter the Services ID as the web client ID and generated client secret. Store credentials only in the provider configuration.
6. Rotate the generated OAuth client secret **before its expiry, at most six months**. Keep the signing key secure for future rotations.
7. Apple Developer → Services → Sign in with Apple for Email Communication: register the actual sending domain/address `auth.morrowgo.com` / `no-reply@auth.morrowgo.com` and complete the required SPF/DKIM setup for private relay delivery.

Use the same Supabase allowlisted MORROWGO callback as Google. Test both Share My Email and Hide My Email. Apple's relay email can differ from an existing customer's email, so it may create a separate account; do not silently merge identities. Web OAuth may not supply a full name; account access must not depend on one.

## 6. Launch verification

Automated tests cover callback validation, unsafe redirect rejection, verification-before-password-update, email enumeration-safe resend/reset responses, enabled-provider checks, new/returning OAuth routing, authorization, logout failure cleanup, and session middleware. Browser checks exercise the actual UI/SSR cookie flow against an isolated test Auth backend; they do not prove real email/provider delivery.

After configuring SMTP/templates and both providers, run with owned test identities on production:

| Scenario | Required live acceptance |
|---|---|
| A–C registration/email/link | Receive branded mail; open in same browser and separate mobile browser; verified session lands on `/account` |
| D–E password login | Correct password signs in; wrong password stays on login with friendly message |
| F recovery | Branded mail; GET does not consume hash; submit password once; old password fails and new password works |
| G–H Google | Fresh Google account and returning/existing confirmed account both reach `/account` |
| I–J Apple | Fresh and returning Apple identities, including relay email, both reach `/account` |
| K logout | Navbar returns to Sign in; old browser cookies removed; account requires login |
| L refresh | Reload and subsequent token refresh keep session; navbar shows My account |
| M account guard | Fresh logged-out browser cannot access `/account` or children |
| N–O responsive | Desktop and mobile forms/social redirects, keyboard focus and no horizontal overflow |
| failure paths | Expired/reused/missing/malformed links, cancelled OAuth, resend and secure email change |

Real A–C/F/G–J are launch gates, not completed by unit mocks. Do not mark production authentication ready until these pass after manual configuration. No production deployment or dashboard write is performed by this code change.

## Official references

- [Supabase email templates and supported variables](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)
- [Custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)
- [Google setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Apple setup and secret rotation](https://supabase.com/docs/guides/auth/social-login/auth-apple)
