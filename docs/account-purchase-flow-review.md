# Account + purchase flow review

No deployment, commit, database migration, dependency change or production configuration change was made.

## Architecture and payment authority
Existing sequence: authenticated customer → server catalogue lookup → Stripe Checkout → signature-verified Stripe webhook → existing Redis fulfillment coordinator → Airalo sandbox order → owned Supabase order/eSIM records. Browser success redirects do not create eSIMs.

Airalo creation remains in the existing fulfillment path after a verified checkout.session.completed or checkout.session.async_payment_succeeded event with payment_status=paid. Existing sandbox and livemode guards remain. Redis token locks and a persistent NX attempt marker prevent repeated provider POSTs; uncertain outcomes are not automatically purchased again. Supabase paid-order RPC and unique Stripe-session mapping preserve idempotent ownership.

## Authentication and selected package
Middleware and server account checks protect /account/*, /profile, /dashboard and checkout. Checkout API independently rejects unauthenticated callers before creating Stripe sessions. A sanitized next=/checkout?iso=JP&plan=... follows login, registration, OAuth, confirmation and resend. Price is never trusted from this URL. Only explicit internal route patterns are allowed.

## Installation data and ownership
Existing customer_orders/customer_esims and private Stripe/Airalo mapping tables are reused. Manual fields originate from Airalo lpa, matching_id and confirmation_code and are persisted as smdpAddress, activationCode and confirmationCode. ICCID remains in the private provider mapping. QR images are retrieved using the real Airalo GET /v2/sims/{iccid} qrcode_url; no guessed/generated QR is used or stored publicly.

QR API requires verified session, owned RLS eSIM lookup and user-scoped private reference lookup. It verifies returned ICCID, restricts signed image URL to Airalo HTTPS /qr, rejects redirects and serves image privately with no-store. Order-status API independently checks Stripe metadata ownership. Foreign IDs cannot retrieve installation data.

My eSIMs reuses existing cards and adds Show QR, manual copy, Escape/outside close and a focus trap. Paid pending orders refresh account state. Success links to the purchased eSIM when the database mapping is available.

## Release configuration requirement
The changed supabase/email-templates/confirm-signup.html must be copied to Supabase Authentication → Email Templates → Confirm signup when these code changes are released. Its link uses {{ .RedirectTo }} plus token_hash and type=signup. Signup/resend now supply /auth/confirm?next=... as RedirectTo. Ensure the existing redirect allowlist covers the production /auth/confirm and /auth/callback routes with query parameters. Do not use the new template before releasing the corresponding code. No live Supabase settings were changed in this task.

## Verification
277 automated tests passed, covering callback returns, checkout auth, ownership, payment/fulfillment idempotency and new QR authorization/proxy cases. Production Next build passed. Running production server returned 307 with preserved next for /account, /account/esims, /profile, /dashboard and selected-package checkout; unauthenticated order-status and QR APIs returned 401. Browser login → registration retained selected package. Auth screen had no horizontal overflow at 375, 390 and 430 px.

Not verified live: authenticated sandbox payment, real provider QR scan, authenticated account/modal visual checks at mobile sizes. No authenticated local test session was available; provider/security cases were tested using mocked responses. These are required before release. Production eSIM purchasing remains disabled by the existing sandbox restrictions.

## Changed files (before this report)
```
 M app/account/esims/page.js
 M app/api/orders/status/route.js
 M app/api/stripe/checkout/route.js
 M app/auth/callback/route.js
 M app/auth/confirm/route.js
 M app/checkout/page.js
 M app/checkout/success/page.js
 M components/account/EsimCard.js
 M components/auth/AuthForm.js
 M components/purchase/startCheckout.js
 M lib/airalo/fulfillment.mjs
 M lib/auth/actions.js
 M lib/auth/config.mjs
 M middleware.js
 M supabase/email-templates/confirm-signup.html
 M tests/auth-actions.test.mjs
 M tests/auth-callbacks.test.mjs
 M tests/auth.test.mjs
 M tests/order-status.test.mjs
 M tests/stripe-checkout.test.mjs
?? app/api/account/esims/[id]/qr/route.js
?? app/dashboard/page.js
?? app/profile/page.js
?? components/account/InstallationPanel.js
?? components/account/PendingEsims.js
?? components/account/installationPanel.module.css
?? tests/account-qr.test.mjs
```
