# MORROWGO account foundation — 11 September 2026

## Delivered

Public support and general-enquiry email links; account navigation; Supabase email/password authentication; protected dashboard, eSIMs, orders and settings; provider-independent usage model and a clearly labelled public demo. The existing dark design, shadows and guest customer flow are preserved.

Routes: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/auth/confirm`, `/auth/callback`, `/account`, `/account/esims`, `/account/orders`, `/account/settings`, `/demo/account`. Read-only JSON routes: `/api/account/esims`, `/api/account/esims/[id]`, `/api/account/orders`.

Without Supabase configuration the site works, account forms display an unavailable notice, protected pages redirect to login and account APIs return 503. No customer data is replaced with demo fixtures.

## Required setup

Follow [auth-setup.md](auth-setup.md) for Supabase email/password, Confirm email ON, custom SMTP, email templates and redirect URLs. Apply `supabase/migrations/202609110001_customer_accounts.sql` once in the intended Supabase project; [account-data.md](account-data.md) explains tables, permissions and future ownership linking.

Vercel variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (or legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`) and `NEXT_PUBLIC_SITE_URL`. Use Node 22 or newer. Redeploy after setting public variables. No service-role key is required. The source checkout includes a lockfile and a blank `.env.example`, not real credentials.

These changes do not create mailboxes. Confirm that support and general-enquiry mailboxes can receive replies with the email provider. Hosted authentication, actual confirmation/reset email delivery and the remote migration still require real project configuration; local test success does not prove those external settings.

## Verification completed

- 170 automated tests passed, including all 103 pre-existing checkout/webhook/order-status tests. Auth actions/callbacks, unverified sessions, safe redirects, ownership filters, serializers and usage edge cases are covered.
- 22 PostgreSQL checks passed using the actual migration in an isolated local PGlite database. Two owners see only their own rows; anonymous reads, customer writes, foreign-order association and private supplier-table access are denied.
- Production builds succeeded with no Supabase settings and with local mock-auth settings using Next 14.2.35 / Node 24.19. Final preview build uses no Supabase credentials.
- Browser checks passed at 1440px and 390px: public email links, login/register/reset, protected-page redirects, unauthenticated API denial, empty account views, session persistence, sign-out, demo usage, top-up unavailable notice, installation details, and no horizontal overflow or JavaScript errors.
- The configured browser test used a local Supabase protocol stub. It exercised actual SDK/server-action/cookie flows without creating real accounts or sending emails.
- The existing guest flow was exercised from country search through plan selection, checkout acknowledgement, mocked payment transition, terminal order states and demo installation. All external requests were blocked in these browser tests.
- SHA256 comparison confirms no changes to Stripe checkout/webhook, the existing guest order status API, catalogue or eSIM fulfillment module. No fulfillment flags were changed and no real supplier transactions/top-ups were made.

## Still to connect

Choose a supplier, implement the owned on-demand usage adapter, add trusted fulfillment-to-account writes and verified guest-order claiming. Real usage, delivery and top-ups remain unavailable. Customer records are empty until trusted integration populates them. This patch is saved locally; publication and hosted-service configuration are separate steps.

## Changed files

- `.env.example`
- `.gitignore`
- `app/account/error.js`
- `app/account/esims/page.js`
- `app/account/layout.js`
- `app/account/loading.js`
- `app/account/orders/page.js`
- `app/account/page.js`
- `app/account/settings/page.js`
- `app/api/account/esims/[id]/route.js`
- `app/api/account/esims/route.js`
- `app/api/account/orders/route.js`
- `app/auth/callback/route.js`
- `app/auth/confirm/route.js`
- `app/demo/account/layout.js`
- `app/demo/account/page.js`
- `app/forgot-password/page.js`
- `app/help/page.js`
- `app/login/page.js`
- `app/page.js`
- `app/register/page.js`
- `app/reset-password/page.js`
- `components/account/AccountNavigation.js`
- `components/account/AccountShell.js`
- `components/account/AccountStates.js`
- `components/account/DashboardOverview.js`
- `components/account/EsimCard.js`
- `components/account/OrderList.js`
- `components/account/account.module.css`
- `components/account/customerData.js`
- `components/auth/AuthForm.js`
- `components/auth/LogoutButton.js`
- `components/auth/auth.module.css`
- `docs/account-data.md`
- `docs/account-foundation-release.md`
- `docs/auth-setup.md`
- `docs/customer-flow-checks.md`
- `lib/account/api.js`
- `lib/account/readers.js`
- `lib/auth/actions.js`
- `lib/auth/config.mjs`
- `lib/auth/session.js`
- `lib/esims/model.js`
- `lib/esims/provider.js`
- `lib/esims/usage.js`
- `lib/supabase/client.js`
- `lib/supabase/server.js`
- `middleware.js`
- `package.json`
- `pnpm-lock.yaml`
- `supabase/migrations/202609110001_customer_accounts.sql`
- `tests/account-data.test.mjs`
- `tests/auth-actions.test.mjs`
- `tests/auth-callbacks.test.mjs`
- `tests/auth.test.mjs`
- `tests/usage.test.mjs`
