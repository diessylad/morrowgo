# Customer UI and auth pass — 2026-09-15

Approved homepage files/assets and Airalo/Stripe business modules are unchanged.
Shared customer header and warm off-white styles now cover the destination,
checkout, help and account surfaces. Login/register use a compact form. The old
public demo-account route redirects to login and its login-page link is removed.

Account pages already had server-side requireAccount checks. Middleware now also
requires a confirmed, server-verified Supabase user before rendering protected
routes, with an exact safe return path. Invalid/unavailable verification fails
closed. Existing login and logout server actions remain in use.

Verified all four protected account URLs as a logged-out visitor at 1440, 1024,
768, 390 and 320 px: redirect to login, no account data. Plan/help/auth screens have
no horizontal overflow or page errors. Tests exercise verified, missing, invalid
and unconfirmed sessions. Real sign-in persistence/logout and a real account
screenshot remain blocked by absent Development Supabase settings; no fake user
or auth bypass was introduced. Do not treat a login screenshot as an account view.

## Actual payment status

- Stripe Checkout is implemented server-side and validates the selected plan/price.
- New Airalo checkout accepts only sk_test_ and AIRALO_MODE=sandbox.
- Development has no STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET, so local Stripe
  Checkout Session creation is not functional yet and was not falsely simulated.
- /api/stripe/webhook exists, verifies signatures, and has an Airalo Sandbox branch.
  Local Stripe event forwarding / webhook connection is not configured or verified.
- Direct Airalo Sandbox ordering passed in the prior task. A successful real Stripe
  test payment triggering Airalo remains unverified end-to-end.
- Needed: Development Stripe test key, local webhook forwarding secret, Redis REST
  configuration, Supabase public/server configuration and an actual signed-in test
  session. Then complete payment, retry webhook, confirm one eSIM/account record,
  check session persistence and logout. No production payments or deployment.
