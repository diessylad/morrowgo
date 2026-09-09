import {
  randomUUID,
  createHash,
  createHmac,
  timingSafeEqual
} from 'crypto';

import {
  createEsimGoTransaction,
  getEsimInstallDetails
} from '../../../../lib/esimgoFulfillment';

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

  if (!response.ok || !data || data.error) {
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

async function saveOrder(key, order, lockKey, lockToken) {
  // Only the current lock owner may change the order.
  const saved = await redisCommand([
    'EVAL',
    "if redis.call('GET', KEYS[1]) == ARGV[1] then redis.call('SET', KEYS[2], ARGV[2]); return 1 else return 0 end",
    '2', lockKey, key, lockToken, JSON.stringify(order)
  ]);
  if (saved !== 1) throw new Error('Order lock lost');
}

async function finishInstallation(apiKey, order, persist) {
  const installDetails = await getEsimInstallDetails(apiKey, order.orderReference);
  await persist({
    ...order,
    installDetails,
    status: 'ready',
    fulfillmentStatus: 'ready',
    updatedAt: new Date().toISOString()
  });
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

  const fulfillmentEnabled =
    String(process.env.ESIM_GO_FULFILLMENT_ENABLED || '').toLowerCase() === 'true';
  const lockToken = randomUUID();
  const attemptKey = `morrowgo:fulfillment-attempt:${sessionId}`;
  const persist = (order) => saveOrder(orderKey, order, lockKey, lockToken);
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
        lockToken,
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

      // Ask Stripe to retry if the current owner fails.
      return Response.json({ received: false, retry: true }, { status: 503 });
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

    let existingOrder = null;
    if (existing) {
      // Corrupt state must never be treated as permission to buy again.
      existingOrder = JSON.parse(existing);
      if (!existingOrder || !existingOrder.status) throw new Error('Invalid stored order');

      if (existingOrder.status === 'ready') {
        return Response.json({ received: true, duplicate: true });
      }
      if (existingOrder.orderReference) {
        if (fulfillmentEnabled) {
          await finishInstallation(esimGoApiKey, existingOrder, persist);
        }
        return Response.json({ received: true });
      }
    }

    // A permanent marker protects against duplicate purchases even after a
    // process crash, Redis write failure, or expiration of the 300-second lock.
    if (await redisCommand(['GET', attemptKey])) {
      console.error('MORROWGO_FULFILLMENT_RECONCILIATION_REQUIRED', { sessionId });
      return Response.json({ received: true, requiresReconciliation: true });
    }

    if (existingOrder &&
        existingOrder.status !== 'processing' &&
        !(fulfillmentEnabled && (
          existingOrder.status === 'validated' ||
          (existingOrder.status === 'fulfilling' && existingOrder.fulfillmentStatus === 'transaction_pending')
        ))) {
      return Response.json({ received: true, duplicate: true });
    }

    const baseOrder = {
      ...existingOrder,
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
        existingOrder?.createdAt || new Date()
          .toISOString(),

      updatedAt:
        new Date()
          .toISOString()
    };

    await persist(baseOrder);

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

        bundleName: bundle.name,
        fulfillmentStatus: 'awaiting_fulfillment',

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

      await persist(validatedOrder);

      if (fulfillmentEnabled) {
        const purchasingOrder = {
          ...validatedOrder,
          status: 'fulfilling',
          fulfillmentStatus: 'transaction_pending',
          updatedAt: new Date().toISOString()
        };
        await persist(purchasingOrder);
        const claimed = await redisCommand([
          'SET', attemptKey, lockToken, 'NX'
        ]);
        if (claimed !== 'OK') {
          return Response.json({ received: true, requiresReconciliation: true });
        }

        // Do not retry a transaction with an uncertain result. Keep the marker.
        const transaction = await createEsimGoTransaction(esimGoApiKey, bundle.name);
        const purchasedOrder = {
          ...purchasingOrder,
          orderReference: transaction.orderReference,
          fulfillmentStatus: 'installation_pending',
          updatedAt: new Date().toISOString()
        };
        await persist(purchasedOrder);
        await finishInstallation(esimGoApiKey, purchasedOrder, persist);
      }


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

      await persist(failedOrder);

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
        error: 'Order processing failed'
      }
    );
    return Response.json({ received: false, error: 'Order processing failed' }, { status: 500 });
  } finally {
    if (lockAcquired) {
      try {
        await redisCommand([
          'EVAL',
          "if redis.call('GET', KEYS[1]) == ARGV[1] then return redis.call('DEL', KEYS[1]) else return 0 end",
          '1', lockKey, lockToken
        ]);
      } catch {
      }
    }
  }

  return Response.json({
    received: true
  });
}
