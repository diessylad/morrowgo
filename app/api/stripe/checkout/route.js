import { getVerifiedAccount } from '../../../../lib/auth/session';

export const dynamic = 'force-dynamic';

function formatData(plan) {
  if (plan.unlimited) {
    return 'Unlimited';
  }

  if (plan.dataGB) {
    return `${plan.dataGB} GB`;
  }

  if (plan.dataMB) {
    return `${plan.dataMB} MB`;
  }

  return 'Data plan';
}

export async function POST(request) {
  const stripeSecretKey =
    process.env.STRIPE_SECRET_KEY;

  if (!stripeSecretKey) {
    return Response.json(
      {
        ok: false,
        error:
          'Stripe secret key is not configured'
      },
      {
        status: 500
      }
    );
  }

  try {
    const body = await request.json();

    const iso = String(
      body?.iso || ''
    )
      .trim()
      .toUpperCase();

    const planId = String(
      body?.plan || ''
    ).trim();

    if (
      !/^[A-Z]{2}$/.test(iso) ||
      !planId
    ) {
      return Response.json(
        {
          ok: false,
          error:
            'Invalid checkout request'
        },
        {
          status: 400
        }
      );
    }

    // Only Supabase's server-verified session can bind an account to payment.
    // Browser-supplied user_id, customer IDs and metadata are intentionally ignored.
    const account = await getVerifiedAccount();
    if (account.error && account.error.name !== 'AuthSessionMissingError') {
      throw new Error('Account verification unavailable');
    }
    const accountUserId = account.user?.id || null;
    if (accountUserId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountUserId)) {
      throw new Error('Invalid verified account');
    }

    const origin =
      new URL(request.url).origin;

    // Получаем тариф заново с нашего
    // серверного каталога.
    // Цена из браузера НЕ используется.
    const catalogueResponse =
      await fetch(
        `${origin}/api/esimgo/catalogue?country=${encodeURIComponent(
          iso
        )}`,
        {
          cache: 'no-store'
        }
      );

    const catalogue =
      await catalogueResponse
        .json()
        .catch(() => null);

    if (
      !catalogueResponse.ok ||
      !catalogue?.ok ||
      !Array.isArray(
        catalogue.packages
      )
    ) {
      return Response.json(
        {
          ok: false,
          error:
            'Could not verify eSIM plan'
        },
        {
          status: 502
        }
      );
    }

    const selectedPlan =
      catalogue.packages.find(
        (item) =>
          item.id === planId
      );

    if (!selectedPlan) {
      return Response.json(
        {
          ok: false,
          error:
            'Selected plan is no longer available'
        },
        {
          status: 404
        }
      );
    }

    const price =
      Number(
        selectedPlan.price
      );

    if (
      !Number.isFinite(price) ||
      price <= 0
    ) {
      return Response.json(
        {
          ok: false,
          error:
            'Invalid plan price'
        },
        {
          status: 500
        }
      );
    }

    const amount =
      Math.round(
        price * 100
      );

    const dataLabel =
      formatData(
        selectedPlan
      );

    const durationLabel =
      `${selectedPlan.duration} ${
        Number(
          selectedPlan.duration
        ) === 1
          ? 'day'
          : 'days'
      }`;

    const stripeBody =
      new URLSearchParams();

    stripeBody.set(
      'mode',
      'payment'
    );

    stripeBody.set(
      'success_url',
      `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
    );

    stripeBody.set(
      'cancel_url',
      `${origin}/checkout?iso=${encodeURIComponent(
        iso
      )}&plan=${encodeURIComponent(
        planId
      )}&canceled=true`
    );

    stripeBody.set(
      'line_items[0][quantity]',
      '1'
    );

    stripeBody.set(
      'line_items[0][price_data][currency]',
      'usd'
    );

    stripeBody.set(
      'line_items[0][price_data][unit_amount]',
      String(amount)
    );

    stripeBody.set(
      'line_items[0][price_data][product_data][name]',
      `MORROWGO ${selectedPlan.country} eSIM - ${dataLabel}`
    );

    stripeBody.set(
      'line_items[0][price_data][product_data][description]',
      `${dataLabel} • ${durationLabel}`
    );

    stripeBody.set(
      'metadata[iso]',
      iso
    );

    stripeBody.set(
      'metadata[plan_id]',
      planId
    );

    if (accountUserId) {
      stripeBody.set('metadata[morrowgo_user_id]', accountUserId.toLowerCase());
      stripeBody.set('metadata[morrowgo_plan_name]', `${selectedPlan.country} · ${dataLabel} / ${durationLabel}`.slice(0, 500));
    }

    const stripeResponse =
      await fetch(
        'https://api.stripe.com/v1/checkout/sessions',
        {
          method: 'POST',

          headers: {
            Authorization:
              `Bearer ${stripeSecretKey}`,

            'Content-Type':
              'application/x-www-form-urlencoded'
          },

          body:
            stripeBody.toString(),

          cache: 'no-store'
        }
      );

    const session =
      await stripeResponse
        .json()
        .catch(() => null);

    if (
      !stripeResponse.ok ||
      !session?.url
    ) {
      return Response.json(
        {
          ok: false,
          error:
            'Stripe could not create checkout session'
        },
        {
          status: 502
        }
      );
    }

    return Response.json({
      ok: true,
      url: session.url
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          'Could not create checkout'
      },
      {
        status: 500
      }
    );
  }
}
