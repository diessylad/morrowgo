import {
  createHmac,
  timingSafeEqual
} from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function parseStripeSignature(header) {
  const parts = String(header || '')
    .split(',')
    .map((part) => part.trim());

  let timestamp = null;
  const signatures = [];

  for (const part of parts) {
    const separator =
      part.indexOf('=');

    if (separator === -1) {
      continue;
    }

    const key =
      part.slice(0, separator);

    const value =
      part.slice(separator + 1);

    if (key === 't') {
      timestamp = value;
    }

    if (key === 'v1') {
      signatures.push(value);
    }
  }

  return {
    timestamp,
    signatures
  };
}

function safeCompareHex(a, b) {
  try {
    const first =
      Buffer.from(a, 'hex');

    const second =
      Buffer.from(b, 'hex');

    if (
      first.length !==
      second.length
    ) {
      return false;
    }

    return timingSafeEqual(
      first,
      second
    );
  } catch {
    return false;
  }
}

function verifyStripeSignature(
  payload,
  signatureHeader,
  secret
) {
  const {
    timestamp,
    signatures
  } = parseStripeSignature(
    signatureHeader
  );

  if (
    !timestamp ||
    signatures.length === 0
  ) {
    return false;
  }

  const timestampNumber =
    Number(timestamp);

  if (
    !Number.isFinite(
      timestampNumber
    )
  ) {
    return false;
  }

  const now =
    Math.floor(
      Date.now() / 1000
    );

  const toleranceSeconds = 300;

  if (
    Math.abs(
      now - timestampNumber
    ) > toleranceSeconds
  ) {
    return false;
  }

  const expected =
    createHmac(
      'sha256',
      secret
    )
      .update(
        `${timestamp}.${payload}`,
        'utf8'
      )
      .digest('hex');

  return signatures.some(
    (signature) =>
      safeCompareHex(
        signature,
        expected
      )
  );
}

export async function POST(request) {
  const webhookSecret =
    process.env
      .STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return Response.json(
      {
        ok: false,
        error:
          'Stripe webhook secret is not configured'
      },
      {
        status: 500
      }
    );
  }

  const rawBody =
    await request.text();

  const signature =
    request.headers.get(
      'stripe-signature'
    );

  const validSignature =
    verifyStripeSignature(
      rawBody,
      signature,
      webhookSecret
    );

  if (!validSignature) {
    return Response.json(
      {
        ok: false,
        error:
          'Invalid Stripe signature'
      },
      {
        status: 400
      }
    );
  }

  let event;

  try {
    event =
      JSON.parse(rawBody);
  } catch {
    return Response.json(
      {
        ok: false,
        error:
          'Invalid JSON payload'
      },
      {
        status: 400
      }
    );
  }

  if (
    event.type ===
      'checkout.session.completed' ||
    event.type ===
      'checkout.session.async_payment_succeeded'
  ) {
    const session =
      event.data?.object;

    const paid =
      event.type ===
        'checkout.session.async_payment_succeeded' ||
      session?.payment_status ===
        'paid';

    if (paid) {
      console.log(
        'MORROWGO_PAYMENT_CONFIRMED',
        {
          eventId:
            event.id,

          sessionId:
            session?.id,

          iso:
            session?.metadata
              ?.iso,

          planId:
            session?.metadata
              ?.plan_id,

          amount:
            session?.amount_total,

          currency:
            session?.currency,

          email:
            session
              ?.customer_details
              ?.email ||
            session
              ?.customer_email ||
            null
        }
      );
    }
  }

  return Response.json({
    received: true
  });
}
