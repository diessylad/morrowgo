# Stripe → eSIM Go fulfillment

Purchases are enabled only when ESIM_GO_FULFILLMENT_ENABLED, lowercased, equals
"true". Missing values, "false", and other values disable fulfillment. Keep the
production environment set to "false" until real purchases are intended.
The existing fulfillment-health endpoint reports the same flag.

## Order lifecycle

The webhook still verifies Stripe's signature against the raw request body
with a five-minute tolerance, checks payment, acquires the per-session Redis
NX/EX lock, resolves the catalogue bundle, and submits type: "validate".

- Validation success, flag off: status = validated,
  fulfillmentStatus = awaiting_fulfillment. No transaction or installation call.
- Validation success, flag on: save fulfilling/transaction_pending, claim a
  permanent per-session purchase marker, then call createEsimGoTransaction.
- Save orderReference in the existing morrowgo:order:<sessionId> Redis record
  immediately after purchase, with fulfillmentStatus = installation_pending.
- Call getEsimInstallDetails using that reference. Save installDetails
  (including activationCode and installation URLs) and status = ready.
- Validation failure retains the existing validation_failed flow.

The webhook response never includes installation details or provider credentials.
The existing orders/status endpoint is unchanged; it does not expose installation
details. Customer display/delivery of these details is a separate integration.

## Retry and recovery

Ready orders are idempotent across both supported Stripe event types.
An active lock returns HTTP 503 so Stripe retries if the current worker fails.
Processing errors return HTTP 500 without provider error messages or secrets.

Redis writes and lock release verify a unique lock-owner token atomically.
Redis HTTP-200 error responses are treated as failures.

morrowgo:fulfillment-attempt:<sessionId> is a permanent NX marker. Keep it for
purchased orders. If purchase results are uncertain or saving orderReference
fails, subsequent deliveries do not purchase again. They log
MORROWGO_FULFILLMENT_RECONCILIATION_REQUIRED and acknowledge with
requiresReconciliation: true. This requires operator reconciliation with eSIM Go:
locate the original transaction, save its verified orderReference on the existing
order, and resend the Stripe event with fulfillment enabled. Never clear the
marker or repeat a purchase without confirming that the original did not occur.

When orderReference is already stored, retries fetch only installation details.
With the flag disabled these retries pause without provider calls. After enabling,
resend the original paid Stripe event to resume. Validated orders also require
a resend after enabling; changing the flag alone does not start a background job.

## Safe verification

Run with Node.js 20 or later:

    node --test tests/stripe-webhook.test.mjs
    pnpm install
    pnpm build

Tests use fake credentials and mock ALL fetch calls, including Redis, validate,
transaction and installation. They never contact Stripe or eSIM Go. They cover
disabled/missing/malformed flags, enabled fulfillment, duplicate events, signature
rejection, failed validation, Redis failures, lost locks, uncertain transactions,
failed reference persistence, installation retry, and enabling/disabling behavior.

After deployment:
1. Open /api/esimgo/fulfillment-health and confirm moduleReady: true and
   fulfillmentEnabled: false.
2. Using a controlled Stripe test environment with the flag false, deliver a
   signed paid checkout event containing the existing iso and plan_id metadata.
   Inspect morrowgo:order:<sessionId>: expect validated/awaiting_fulfillment,
   no orderReference, and no transaction in eSIM Go.
3. Resend the same event: no second validation or purchase should occur.
4. Test the true branch using the automated mocks. Stripe test mode alone does
   not make the eSIM Go API a sandbox; enabling the flag against the real eSIM Go
   API can spend real funds.
