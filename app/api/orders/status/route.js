export const dynamic = 'force-dynamic';

function getRedisConfig() {
  const url =
    process.env.STORAGE_KV_REST_API_URL ||
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    '';

  const token =
    process.env.STORAGE_KV_REST_API_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    '';

  return { url, token };
}

async function redisCommand(command) {
  const { url, token } =
    getRedisConfig();

  if (!url || !token) {
    throw new Error(
      'Redis is not configured'
    );
  }

  const response =
    await fetch(url, {
      method: 'POST',

      headers: {
        Authorization:
          `Bearer ${token}`,

        'Content-Type':
          'application/json'
      },

      body:
        JSON.stringify(command),

      cache: 'no-store'
    });

  const data =
    await response
      .json()
      .catch(() => null);

  if (
    !response.ok ||
    !data ||
    data.error
  ) {
    throw new Error(
      `Redis failed: ${response.status}`
    );
  }

  return data?.result;
}

async function getStripeSession(
  sessionId
) {
  const stripeSecretKey =
    process.env
      .STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    throw new Error(
      'Stripe is not configured'
    );
  }

  const response =
    await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(
        sessionId
      )}`,
      {
        headers: {
          Authorization:
            `Bearer ${stripeSecretKey}`
        },

        cache: 'no-store'
      }
    );

  const data =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    return null;
  }

  return data;
}

function getCustomerStatus(order) {
  const status =
    String(
      order?.status || ''
    );

  const fulfillmentStatus =
    String(
      order?.fulfillmentStatus || ''
    );

  if (
    status === 'ready' ||
    fulfillmentStatus === 'ready'
  ) {
    return 'ready';
  }

  if (
    status === 'validation_failed' ||
    status === 'fulfillment_uncertain' ||
    status === 'failed' ||
    status === 'error'
  ) {
    return 'needs_attention';
  }

  if (
    status === 'validated' ||
    status === 'processing' ||
    status === 'fulfilling' ||
    fulfillmentStatus ===
      'awaiting_fulfillment' ||
    fulfillmentStatus ===
      'transaction_pending' ||
    fulfillmentStatus ===
      'installation_pending'
  ) {
    return 'awaiting_esim';
  }

  return 'awaiting_esim';
}

function getInstallation(order) {
  const source =
    order?.installDetails ||
    order?.esim ||
    null;

  if (!source) {
    return null;
  }

  const smdpAddress =
    source.smdpAddress ||
    null;

  const matchingId =
    source.matchingId ||
    null;

  const activationCode =
    source.activationCode ||
    (
      smdpAddress &&
      matchingId
        ? `LPA:1$${smdpAddress}$${matchingId}`
        : null
    );

  return {
    appleInstallUrl:
      source.appleInstallUrl ||
      null,

    androidInstallUrl:
      source.androidInstallUrl ||
      null,

    smdpAddress,

    matchingId,

    activationCode,

    profileStatus:
      source.profileStatus ||
      null
  };
}

export async function GET(request) {
  try {
    const url =
      new URL(request.url);

    const sessionId =
      String(
        url.searchParams.get(
          'session_id'
        ) || ''
      ).trim();

    if (
      !/^cs_(test|live)_[A-Za-z0-9]+$/.test(
        sessionId
      )
    ) {
      return Response.json(
        {
          ok: false,
          error:
            'Invalid session'
        },
        {
          status: 400
        }
      );
    }

    const stripeSession =
      await getStripeSession(
        sessionId
      );

    if (!stripeSession) {
      return Response.json(
        {
          ok: false,
          error:
            'Checkout session not found'
        },
        {
          status: 404
        }
      );
    }

    if (
      stripeSession
        .payment_status !==
      'paid'
    ) {
      return Response.json({
        ok: true,
        paid: false,
        customerStatus:
          'payment_pending',
        status:
          'payment_pending'
      });
    }

    const orderKey =
      `morrowgo:order:${sessionId}`;

    const stored =
      await redisCommand([
        'GET',
        orderKey
      ]);

    if (!stored) {
      return Response.json({
        ok: true,
        paid: true,

        customerStatus:
          'payment_confirmed',

        status:
          'processing',

        iso:
          stripeSession
            ?.metadata
            ?.iso ||
          null,

        amount:
          stripeSession
            .amount_total ||
          null,

        currency:
          stripeSession
            .currency ||
          null
      });
    }

    let order;

    try {
      order =
        JSON.parse(stored);
    } catch {
      return Response.json(
        {
          ok: false,
          error:
            'Invalid stored order'
        },
        {
          status: 500
        }
      );
    }

    const customerStatus =
      getCustomerStatus(order);

    const result = {
      ok: true,

      paid: true,

      customerStatus,

      status:
        order.status ||
        'processing',

      iso:
        order.iso ||
        stripeSession
          ?.metadata
          ?.iso ||
        null,

      amount:
        order.amount ||
        stripeSession
          .amount_total ||
        null,

      currency:
        order.currency ||
        stripeSession
          .currency ||
        null
    };

    /*
      Installation details are exposed
      only after the order is actually ready.
    */
    if (
      customerStatus === 'ready'
    ) {
      result.installation =
        getInstallation(order);
    }

    return Response.json(
      result
    );
  } catch {
    return Response.json(
      {
        ok: false,
        error:
          'Could not load order'
      },
      {
        status: 500
      }
    );
  }
}
