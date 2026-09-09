export async function GET() {
  const apiKey = process.env.ESIM_GO_API_KEY;

  if (!apiKey) {
    return Response.json(
      { ok: false, error: 'API key is not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      'https://api.esim-go.com/v2.5/catalogue?perPage=50',
      {
        headers: {
          'X-API-Key': apiKey,
          Accept: 'application/json',
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      return Response.json(
        {
          ok: false,
          upstreamStatus: response.status,
        },
        { status: 502 }
      );
    }

    const data = await response.json();

    const bundles = data.map((bundle) => ({
      name: bundle.name,
      description: bundle.description,
      countries: bundle.countries,
      dataAmount: bundle.dataAmount,
      duration: bundle.duration,
      price: bundle.price,
      unlimited: bundle.unlimited,
      speed: bundle.speed,
    }));

    return Response.json({
      ok: true,
      count: bundles.length,
      bundles,
    });
  } catch {
    return Response.json(
      { ok: false, error: 'Could not load eSIM Go catalogue' },
      { status: 502 }
    );
  }
}
