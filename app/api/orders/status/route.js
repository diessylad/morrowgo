export const dynamic = 'force-dynamic';

function json(data, options = {}) {
  return Response.json(data, {
    ...options,
    headers: { 'Cache-Control': 'private, no-store' }
  });
}

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

  if (!response.ok || !data || data.error) {
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
      return json(
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

    /*
      Проверяем оплату напрямую
      через Stripe.
    */
    const stripeSession =
      await getStripeSession(
        sessionId
      );

    if (!stripeSession) {
      return json(
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
      return json({
        ok: true,
        testMode: stripeSession.livemode === false,
        paid: false,
        status:
          'payment_pending'
      });
    }

    /*
      Ищем заказ MORROWGO,
      созданный webhook.
    */
    const orderKey =
      `morrowgo:order:${sessionId}`;

    const stored =
      await redisCommand([
        'GET',
        orderKey
      ]);

    /*
      Stripe уже подтвердил оплату,
      но webhook может прийти
      на несколько секунд позже.
    */
    if (!stored) {
      return json({
        ok: true,
        testMode: stripeSession.livemode === false,
        paid: true,
        status:
          'processing'
      });
    }

    let order;

    try {
      order =
        JSON.parse(stored);
      if (!order || typeof order !== 'object' || Array.isArray(order)) {
        throw new Error('Invalid stored order');
      }
    } catch {
      return json(
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

    return json({
      ok: true,

      paid: true,
      testMode: stripeSession.livemode === false,
      fulfillmentStatus: order.fulfillmentStatus || null,

      status:
        order.status ||
        'unknown',

      iso:
        order.iso ||
        null,

      amount:
        order.amount ??
        stripeSession
          .amount_total ??
        null,

      currency:
        order.currency ||
        stripeSession
          .currency ||
        null
    });
  } catch (error) {
    return json(
      {
        ok: false,

        error: 'Could not load order'
      },
      {
        status: 500
      }
    );
  }
}
