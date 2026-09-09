import { createHash } from 'crypto';

function makePublicId(bundleName) {
  return createHash('sha256')
    .update(String(bundleName || ''))
    .digest('hex')
    .slice(0, 16);
}

function calculateRetailPrice(cost) {
  const numericCost = Number(cost);

  if (!Number.isFinite(numericCost)) return null;

  const retail = Math.max(
    numericCost * 1.4,
    numericCost + 2
  );

  return Math.ceil(retail * 100) / 100;
}

function findCatalogueArray(value, depth = 0) {
  if (Array.isArray(value)) return value;

  if (
    !value ||
    typeof value !== 'object' ||
    depth > 3
  ) {
    return null;
  }

  const preferredKeys = [
    'bundles',
    'data',
    'items',
    'catalogue',
    'results',
  ];

  for (const key of preferredKeys) {
    if (Array.isArray(value[key])) {
      return value[key];
    }
  }

  for (const child of Object.values(value)) {
    const found = findCatalogueArray(
      child,
      depth + 1
    );

    if (found) return found;
  }

  return null;
}

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const apiKey = process.env.ESIM_GO_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        ok: false,
        error: 'API key is not configured',
      },
      { status: 500 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);

    const country = searchParams
      .get('country')
      ?.trim()
      .toUpperCase();

    if (country && !/^[A-Z]{2}$/.test(country)) {
      return Response.json(
        {
          ok: false,
          error: 'Invalid country ISO code',
        },
        { status: 400 }
      );
    }

    const params = new URLSearchParams({
      page: '1',
      perPage: '100',
    });

    if (country) {
      params.set('countries', country);
    }

    const response = await fetch(
      `https://api.esim-go.com/v2.5/catalogue?${params.toString()}`,
      {
        headers: {
          'X-API-Key': apiKey,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    const payload = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      return Response.json(
        {
          ok: false,
          upstreamStatus: response.status,
          error: 'eSIM Go catalogue request failed',
        },
        { status: 502 }
      );
    }

    const catalogue = findCatalogueArray(payload);

    if (!catalogue) {
      return Response.json(
        {
          ok: false,
          error: 'Unexpected catalogue format',
          keys:
            payload &&
            typeof payload === 'object'
              ? Object.keys(payload)
              : [],
        },
        { status: 502 }
      );
    }

    const packages = catalogue
      .filter((bundle) => {
        if (!country) return true;

        return bundle.countries?.some(
          (item) => item?.iso === country
        );
      })
      .map((bundle) => {
        const mainCountry =
          bundle.countries?.find(
            (item) => item?.iso === country
          ) || bundle.countries?.[0];

        return {
          id: makePublicId(bundle.name),

          country:
            mainCountry?.name || null,

          iso:
            mainCountry?.iso || null,

          dataMB:
            bundle.dataAmount ?? null,

          dataGB:
            Number(bundle.dataAmount) >= 1000
              ? Number(bundle.dataAmount) / 1000
              : null,

          duration:
            bundle.duration ?? null,

          durationUnit:
            bundle.durationUnit || 'day',

          unlimited:
            Boolean(bundle.unlimited),

          price:
            calculateRetailPrice(bundle.price),

          currency: 'USD',
        };
      })
      .filter(
        (item) => item.price !== null
      )
      .sort((a, b) => a.price - b.price);

    return Response.json({
      ok: true,
      country: country || null,
      count: packages.length,
      packages,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: 'Could not load MORROWGO catalogue',
        detail:
          error?.message || 'Unknown error',
      },
      { status: 502 }
    );
  }
}
