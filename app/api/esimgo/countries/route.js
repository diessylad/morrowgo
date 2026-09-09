export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.ESIM_GO_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        ok: false,
        error: 'API key is not configured'
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      'https://api.esim-go.com/v2.5/networks?returnAll=true',
      {
        headers: {
          'X-API-Key': apiKey,
          Accept: 'application/json'
        },
        next: {
          revalidate: 21600
        }
      }
    );

    const data = await response
      .json()
      .catch(() => null);

    if (!response.ok) {
      return Response.json(
        {
          ok: false,
          upstreamStatus: response.status,
          error: 'Could not load countries'
        },
        { status: 502 }
      );
    }

    const rawCountries =
      data?.countryNetworks || [];

    const countries = rawCountries
      .map((item) => {
        const iso = String(
          item?.iso ||
          item?.country?.iso ||
          item?.name ||
          ''
        ).toUpperCase();

        return {
          iso
        };
      })
      .filter(
        (item) =>
          /^[A-Z]{2}$/.test(item.iso)
      )
      .filter(
        (item, index, array) =>
          array.findIndex(
            (x) => x.iso === item.iso
          ) === index
      )
      .sort((a, b) =>
        a.iso.localeCompare(b.iso)
      );

    return Response.json({
      ok: true,
      count: countries.length,
      countries
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: 'Could not load countries',
        detail:
          error?.message || 'Unknown error'
      },
      { status: 502 }
    );
  }
}
