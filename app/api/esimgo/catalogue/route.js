import { createHash } from 'crypto';

function makePublicId(bundleName) {
  return createHash('sha256')
    .update(bundleName)
    .digest('hex')
    .slice(0, 16);
}

function calculateRetailPrice(cost) {
  const numericCost = Number(cost);

  // 40% markup, but at least $2 gross margin
  const retail = Math.max(
    numericCost * 1.4,
    numericCost + 2
  );

  return Math.ceil(retail * 100) / 100;
}

export async function GET(request) {
  const apiKey = process.env.ESIM_GO_API_KEY;

  if (!apiKey) {
    return Response.json(
      { ok: false, error: 'API key is not configured' },
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
        { ok: false, error: 'Invalid country ISO code' },
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

        // Do not constantly poll eSIM Go
        next: {
          revalidate: 3600,
        },
      }
    );

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

    const catalogue = await response.json();

    if (!Array.isArray(catalogue)) {
      return Response.json(
        {
          ok: false,
          error: 'Unexpected catalogue format',
        },
        { status: 502 }
      );
    }

    const packages = catalogue
      .filter((bundle) => {
        if (!country) return true;

        return bundle.countries?.some(
          (item) => item.iso === country
        );
      })
      .map((bundle) => {
        const mainCountry =
          bundle.countries?.find(
            (item) => item.iso === country
          ) || bundle.countries?.[0];

        return {
          id: makePublicId(bundle.name),

          country: mainCountry?.name || null,
          iso: mainCountry?.iso || null,

          dataMB: bundle.dataAmount,
          dataGB:
            bundle.dataAmount >= 1000
              ? bundle.dataAmount / 1000
              : null,

          duration: bundle.duration,
          durationUnit: bundle.durationUnit || 'day',

          unlimited: Boolean(bundle.unlimited),

          price: calculateRetailPrice(bundle.price),
          currency: 'USD',
        };
      })
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
        detail: error?.message || 'Unknown error',
      },
      { status: 502 }
    );
  }
}
