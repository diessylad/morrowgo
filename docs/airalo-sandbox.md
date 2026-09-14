# Airalo Sandbox integration

The approved homepage assets remain unchanged. Search uses the complete normalized
catalogue; the initial six featured destinations retain their layout. Checkout
uses EUR recommended retail prices, verified again server-side, and only a Stripe
test key is accepted. Browser user IDs and browser prices are ignored.

## Environment

Existing server-only names: AIRALO_CLIENT_ID, AIRALO_CLIENT_SECRET, AIRALO_MODE.
AIRALO_MODE must be sandbox. The Airalo company itself must also remain in Sandbox:
the local flag does not change the upstream company mode. Company Sandbox was
confirmed in the user's Partner Platform screenshot before the test order.

Local Development currently contains Airalo credentials but not Stripe, Redis or
Supabase settings. A complete payment/account test requires STRIPE_SECRET_KEY
(test), STRIPE_WEBHOOK_SECRET (local test forwarding), the existing Redis REST
URL/token names, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
and SUPABASE_SECRET_KEY. Never commit .env.local. No production deployment made.

## Provider endpoints

POST /v2/token; GET /v2/packages (paginated); POST /v2/orders;
GET /v2/sims/{iccid}/instructions, /usage and /topups.
Tokens are cached per process with single-flight authentication. GET requests have
bounded retry/backoff. POST orders are never retried. Token caching across cold
instances is a remaining production scaling concern.

The signed webhook's Airalo branch requires a paid Stripe test session and Sandbox
metadata. It retains the existing Redis order, lock and permanent attempt key
namespace. An uncertain purchase or failed reference save requires reconciliation;
it never permits a second purchase. An account storage retry uses the saved order.
Legacy sessions without Airalo metadata retain the old eSIM Go branch for recovery;
new customer checkout never selects it. Legacy provider routes/files remain for
rollback only. Do not enable their fulfillment flag.

## Account storage

202609140001_airalo_sandbox_esims.sql is additive and has been applied to the linked
Supabase project. Provider identifiers live in a private, RLS-protected table.
Service-only RPCs create one eSIM per order and look up owned references. Existing
customer SELECT-only policies remain unchanged. RPC duplicate and ownership checks
were verified inside a rolled-back transaction. No fake customer records remain.

My eSIMs provides an explicit refresh action for Sandbox usage, instructions and
compatible topups; topup purchasing remains disabled. Sandbox eSIMs cannot install.
The sample device artwork continues to show sample screen data.

## Verified

Live Airalo authentication and complete catalogue succeeded (195 local countries,
1806 eligible EUR SIM packages at verification). One direct Sandbox order succeeded.
Instructions, usage and compatible topup requests succeeded. The test attempt and
its result were saved outside the repository in private temporary files to prevent
accidental repeat orders. No secrets, ICCIDs or access tokens appear in this report.

Browser checks: 1440, 768 and 390 px; home search → Japan → plan → checkout;
login route loads, no page errors or horizontal overflow. A complete Stripe test
payment → webhook → real account UI verification remains pending Development
Stripe/Redis/Supabase configuration. Do not switch company mode or deploy yet.
