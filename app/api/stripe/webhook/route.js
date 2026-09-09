import {
  createHash,
  createHmac,
  timingSafeEqual
} from 'crypto';

export const runtime = 'nodejs';
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

  if (!response.ok) {
    throw new Error(
      `Redis failed: ${response.status}`
    );
  }

  return data?.result;
}

function makePublicId(bundleName) {
  return createHash('sha256')
    .update(
      String(bundleName || '')
    )
    .digest('hex')
    .slice(0, 16);
}

function parseStripeSignature(header) {
  const parts =
    String(header || '')
      .split(',')
      .map(
        (part) =>
          part.trim()
      );

  let timestamp = null;
  const signatures = [];

  for (const part of parts) {
    const separator =
      part.indexOf('=');

    if (separator === -1) {
      continue;
    }

    const key =
      part.slice(
        0,
        separator
      );

    const value =
      part.slice(
        separator + 1
      );

    if (key === 't') {
      timestamp = value;
    }

    if (key === 'v1') {
      signatures.push(
        value
      );
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
      Buffer.from(
        a,
        'hex'
      );

    const second =
      Buffer.from(
        b,
        'hex'
      );

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
  } =
    parseStripeSignature(
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

  if (
    Math.abs(
      now -
        timestampNumber
    ) > 300
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

function findCatalogueArray(
  value,
  depth = 0
) {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    !value ||
    typeof value !==
      'object' ||
    depth > 3
  ) {
    return null;
  }

  const preferredKeys = [
    'bundles',
    'data',
    'items',
    'catalogue',
    'results'
  ];

  for (
    const key of
    preferredKeys
  ) {
    if (
      Array.isArray(
        value[key]
      )
    ) {
      return value[key];
    }
  }

  for (
    const child of
    Object.values(value)
  ) {
    const found =
      findCatalogueArray(
        child,
        depth + 1
      );

    if (found) {
      return found;
    }
  }

  return null;
}

async function findEsimGoBundle(
  apiKey,
  iso,
  planId
) {
  const params =
    new URLSearchParams({
      page: '1',
      perPage: '100',
      countries: iso
    });

  const response =
    await fetch(
      `https://api.esim-go.com/v2.5/catalogue?${params.toString()}`,
      {
        headers: {
          'X-API-Key':
            apiKey,

          Accept:
            'application/json'
        },

        cache:
          'no-store'
      }
    );

  const payload =
    await response
      .json()
      .catch(() => null);

  if (!response.ok) {
    throw new Error(
      `eSIM Go catalogue failed: ${response.status}`
    );
  }

  const catalogue =
    findCatalogueArray(
      payload
    );

  if (!catalogue) {
    throw new Error(
      'Unexpected eSIM Go catalogue format'
    );
  }

  const bundle =
    catalogue.find(
      (item) => {
        const belongsToCountry =
          item.countries?.some(
            (country) =>
              country?.iso ===
              iso
          );

        return (
          belongsToCountry &&
          makePublicId(
            item.name
          ) === planId
        );
      }
    );

  if (!bundle) {
    throw new Error(
      'eSIM Go bundle not found'
    );
  }

  return bundle;
}

async function validateEsimGoOrder(
  apiKey,
  bundleName
) {
  const response =
    await fetch(
      'https://api.esim-go.com/v2.5/orders',
      {
        method: 'POST',

        headers: {
          'X-API-Key':
            apiKey,

          'Content-Type':
            'application/json',

          Accept:
            'application/json'
        },

        body:
          JSON.stringify({
            type: 'validate',
            assign: true,

            order: [
              {
                type:
                  'bundle',

                quantity: 1,

                item:
                  bundleName,

                allowReassign:
                  false
              }
            ]
          }),

        cache:
          'no-store'
      }
    );

  const data =
    await response
      .json()
      .catch(() => null);

  return {
    ok: response.ok,
    status:
      response.status,
    data
  };
}

async function saveOrder(
  key,
  order
) {
  await redisCommand([
    'SET',
    key,
    JSON.stringify(order)
  ]);
}

export async function POST(
  request
) {
  const webhookSecret =
    process.env
      .STRIPE_WEBHOOK_SECRET;

  const esimGoApiKey =
    process.env
      .ESIM_GO_API_KEY;

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

  if (!esimGoApiKey) {
    return Response.json(
      {
        ok: false,
        error:
          'eSIM Go API key is not configured'
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

  const paymentEvent =
    event.type ===
      'checkout.session.completed' ||
    event.type ===
      'checkout.session.async_payment_succeeded';

  if (!paymentEvent) {
    return Response.json({
      received: true
    });
  }

  const session =
    event.data?.object;

  const paid =
    event.type ===
      'checkout.session.async_payment_succeeded' ||
    session
      ?.payment_status ===
      'paid';

  if (!paid) {
    return Response.json({
      received: true
    });
  }

  const sessionId =
    String(
      session?.id || ''
    );

  const iso =
    String(
      session?.metadata
        ?.iso || ''
    ).toUpperCase();

  const planId =
    String(
      session?.metadata
        ?.plan_id || ''
    );

  if (
    !sessionId ||
    !/^[A-Z]{2}$/.test(
      iso
    ) ||
    !planId
  ) {
    console.error(
      'MORROWGO_ORDER_METADATA_INVALID'
    );

    return Response.json({
      received: true
    });
  }

  const orderKey =
    `morrowgo:order:${sessionId}`;

  const lockKey =
    `morrowgo:lock:${sessionId}`;

  let lockAcquired = false;

  try {
    /*
      Atomic lock.

      If two Stripe webhooks arrive
      simultaneously, only one gets OK.
    */
    const lockResult =
      await redisCommand([
        'SET',
        lockKey,
        event.id,
        'NX',
        'EX',
        '300'
      ]);

    if (
      lockResult !== 'OK'
    ) {
      console.log(
        'MORROWGO_DUPLICATE_BLOCKED',
        {
          sessionId
        }
      );

      return Response.json({
        received: true,
        duplicate: true
      });
    }

    lockAcquired = true;

    /*
      Check if this Stripe session
      was already processed earlier.
    */
    const existing =
      await redisCommand([
        'GET',
        orderKey
      ]);

    if (existing) {
      let existingOrder =
        null;

      try {
        existingOrder =
          JSON.parse(
            existing
          );
      } catch {
      }

      if (
        existingOrder &&
        existingOrder.status &&
        existingOrder.status !==
          'processing'
      ) {
        console.log(
          'MORROWGO_ORDER_ALREADY_EXISTS',
          {
            sessionId,
            status:
              existingOrder.status
          }
        );

        return Response.json({
          received: true,
          duplicate: true
        });
      }
    }

    const baseOrder = {
      stripeSessionId:
        sessionId,

      stripeEventId:
        event.id,

      status:
        'processing',

      iso,

      planId,

      amount:
        session
          ?.amount_total ||
        null,

      currency:
        session
          ?.currency ||
        null,

      email:
        session
          ?.customer_details
          ?.email ||
        session
          ?.customer_email ||
        null,

      createdAt:
        new Date()
          .toISOString(),

      updatedAt:
        new Date()
          .toISOString()
    };

    await saveOrder(
      orderKey,
      baseOrder
    );

    console.log(
      'MORROWGO_ORDER_CREATED',
      {
        sessionId,
        iso
      }
    );

    const bundle =
      await findEsimGoBundle(
        esimGoApiKey,
        iso,
        planId
      );

    const validation =
      await validateEsimGoOrder(
        esimGoApiKey,
        bundle.name
      );

    if (
      validation.ok &&
      validation.data
        ?.valid === true
    ) {
      const validatedOrder = {
        ...baseOrder,

        status:
          'validated',

        esimGoValidation: {
          valid: true,

          total:
            validation.data
              ?.total ||
            null,

          currency:
            validation.data
              ?.currency ||
            null
        },

        updatedAt:
          new Date()
            .toISOString()
      };

      await saveOrder(
        orderKey,
        validatedOrder
      );

      console.log(
        'MORROWGO_ESIMGO_VALIDATE_OK',
        {
          sessionId,
          iso
        }
      );
    } else {
      const failedOrder = {
        ...baseOrder,

        status:
          'validation_failed',

        esimGoValidation: {
          valid: false,

          upstreamStatus:
            validation.status,

          message:
            validation.data
              ?.message ||
            validation.data
              ?.error ||
            null
        },

        updatedAt:
          new Date()
            .toISOString()
      };

      await saveOrder(
        orderKey,
        failedOrder
      );

      console.error(
        'MORROWGO_ESIMGO_VALIDATE_FAILED',
        {
          sessionId,
          iso,
          upstreamStatus:
            validation.status,
          valid:
            validation.data
              ?.valid ??
            null
        }
      );
    }
  } catch (error) {
    console.error(
      'MORROWGO_ORDER_PROCESSING_ERROR',
      {
        sessionId,
        error:
          error?.message ||
          'Unknown error'
      }
    );
  } finally {
    if (lockAcquired) {
      try {
        await redisCommand([
          'DEL',
          lockKey
        ]);
      } catch {
      }
    }
  }

  return Response.json({
    received: true
  });
}
