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
    'results'
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

function durationRank(duration, preferred) {
  const index = preferred.indexOf(
    Number(duration)
  );

  return index === -1 ? 999 : index;
}

function pickBestFinite(
  packages,
  dataGB,
  preferredDurations
) {
  return (
    packages
      .filter(
        (plan) =>
          !plan.unlimited &&
          Number(plan.dataGB) === dataGB &&
          Number(plan.duration) >= 1 &&
          Number(plan.duration) <= 30
      )
      .sort((a, b) => {
        const rankDiff =
          durationRank(
            a.duration,
            preferredDurations
          ) -
          durationRank(
            b.duration,
            preferredDurations
          );

        if (rankDiff !== 0) {
          return rankDiff;
        }

        return a.price - b.price;
      })[0] || null
  );
}

function pickUnlimited(packages) {
  return (
    packages
      .filter(
        (plan) =>
          plan.unlimited &&
          Number(plan.duration) >= 7 &&
          Number(plan.duration) <= 30
      )
      .sort((a, b) => {
        const preferred = [
          7,
          10,
          15,
          30,
          14,
          20
        ];

        const rankDiff =
          durationRank(
            a.duration,
            preferred
          ) -
          durationRank(
            b.duration,
            preferred
          );

        if (rankDiff !== 0) {
          return rankDiff;
        }

        return a.price - b.price;
      })[0] || null
  );
}

function curatePackages(packages) {
  const selected = [];

  const targets = [
    {
      dataGB: 1,
      durations: [7, 15, 30]
    },
    {
      dataGB: 3,
      durations: [30, 15, 7]
    },
    {
      dataGB: 5,
      durations: [30, 15, 7]
    },
    {
      dataGB: 10,
      durations: [30, 15, 7]
    },
    {
      dataGB: 20,
      durations: [30, 15, 7]
    }
  ];

  for (const target of targets) {
    const plan = pickBestFinite(
      packages,
      target.dataGB,
      target.durations
    );

    if (plan) {
      selected.push(plan);
    }
  }

  // Если в какой-то стране нет стандартных
  // 1/3/5/10/20 GB — берём нормальные
  // ближайшие варианты, но не больше пяти.
  if (selected.length < 3) {
    const fallback = packages
      .filter(
        (plan) =>
          !plan.unlimited &&
          Number(plan.dataGB) > 0 &&
          Number(plan.dataGB) <= 50 &&
          Number(plan.duration) >= 7 &&
          Number(plan.duration) <= 30
      )
      .sort((a, b) => {
        if (a.dataGB !== b.dataGB) {
          return a.dataGB - b.dataGB;
        }

        return a.price - b.price;
      });

    for (const plan of fallback) {
      if (selected.length >= 5) {
        break;
      }

      const duplicate = selected.some(
        (existing) =>
          existing.dataGB ===
            plan.dataGB &&
          existing.duration ===
            plan.duration
      );

      if (!duplicate) {
        selected.push(plan);
      }
    }
  }

  const unlimited = pickUnlimited(
    packages
  );

  if (unlimited) {
    selected.push(unlimited);
  }

  return selected
    .slice(0, 6)
    .map((plan) => ({
      ...plan,

      popular:
        !plan.unlimited &&
        Number(plan.dataGB) === 5
    }));
}

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const apiKey =
    process.env.ESIM_GO_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        ok: false,
        error:
          'API key is not configured'
      },
      {
        status: 500
      }
    );
  }

  try {
    const { searchParams } =
      new URL(request.url);

    const country = searchParams
      .get('country')
      ?.trim()
      .toUpperCase();

    if (
      country &&
      !/^[A-Z]{2}$/.test(country)
    ) {
      return Response.json(
        {
          ok: false,
          error:
            'Invalid country ISO code'
        },
        {
          status: 400
        }
      );
    }

    const params =
      new URLSearchParams({
        page: '1',
        perPage: '100'
      });

    if (country) {
      params.set(
        'countries',
        country
      );
    }

    const response = await fetch(
      `https://api.esim-go.com/v2.5/catalogue?${params.toString()}`,
      {
        headers: {
          'X-API-Key': apiKey,
          Accept:
            'application/json'
        },
        cache: 'no-store'
      }
    );

    const payload =
      await response
        .json()
        .catch(() => null);

    if (!response.ok) {
      return Response.json(
        {
          ok: false,
          upstreamStatus:
            response.status,
          error:
            'eSIM Go catalogue request failed'
        },
        {
          status: 502
        }
      );
    }

    const catalogue =
      findCatalogueArray(payload);

    if (!catalogue) {
      return Response.json(
        {
          ok: false,
          error:
            'Unexpected catalogue format'
        },
        {
          status: 502
        }
      );
    }

    const allPackages =
      catalogue
        .filter((bundle) => {
          if (!country) {
            return true;
          }

          return bundle.countries?.some(
            (item) =>
              item?.iso === country
          );
        })
        .map((bundle) => {
          const mainCountry =
            bundle.countries?.find(
              (item) =>
                item?.iso === country
            ) ||
            bundle.countries?.[0];

          return {
            id: makePublicId(
              bundle.name
            ),

            country:
              mainCountry?.name ||
              null,

            iso:
              mainCountry?.iso ||
              null,

            dataMB:
              bundle.dataAmount ??
              null,

            dataGB:
              Number(
                bundle.dataAmount
              ) >= 1000
                ? Number(
                    bundle.dataAmount
                  ) / 1000
                : null,

            duration:
              bundle.duration ??
              null,

            durationUnit:
              bundle.durationUnit ||
              'day',

            unlimited:
              Boolean(
                bundle.unlimited
              ),

            price:
              calculateRetailPrice(
                bundle.price
              ),

            currency: 'USD'
          };
        })
        .filter(
          (item) =>
            item.price !== null
        );

    const packages = country
      ? curatePackages(
          allPackages
        )
      : allPackages;

    return Response.json({
      ok: true,
      country:
        country || null,
      count:
        packages.length,
      packages
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error:
          'Could not load MORROWGO catalogue',
        detail:
          error?.message ||
          'Unknown error'
      },
      {
        status: 502
      }
    );
  }
}
