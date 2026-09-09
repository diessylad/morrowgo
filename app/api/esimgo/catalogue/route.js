export const dynamic = 'force-dynamic';

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
      'https://api.esim-go.com/v2.5/catalogue?page=1&perPage=50',
      {
        headers: {
          'X-API-Key': apiKey,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    const raw = await response.text();

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

    let data;

    try {
      data = JSON.parse(raw);
    } catch {
      return Response.json(
        {
          ok: false,
          error: 'eSIM Go returned invalid JSON',
          bodyLength: raw.length,
        },
        { status: 502 }
      );
    }

    const catalogue = Array.isArray(data)
      ? data
      : Array.isArray(data?.bundles)
      ? data.bundles
      : Array.isArray(data?.data)
      ? data.data
      : null;

    if (!catalogue) {
      return Response.json(
        {
          ok: false,
          error: 'Unexpected catalogue format',
          keys:
            data && typeof data === 'object'
              ? Object.keys(data)
              : [],
        },
        { status: 502 }
      );
    }

    return Response.json({
      ok: true,
      count: catalogue.length,
      bundles: catalogue.slice(0, 10),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: 'Could not load eSIM Go catalogue',
        detail: error?.message || 'Unknown error',
      },
      { status: 502 }
    );
  }
}
