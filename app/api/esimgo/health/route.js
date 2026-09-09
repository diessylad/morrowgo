export const dynamic = 'force-dynamic';

export async function GET() {
  const apiKey = process.env.ESIM_GO_API_KEY;

  if (!apiKey) {
    return Response.json(
      {
        ok: false,
        error: 'ESIM_GO_API_KEY is not configured',
      },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      'https://api.esim-go.com/v2.5/catalogue?perPage=1',
      {
        headers: {
          'X-API-Key': apiKey,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return Response.json(
        {
          ok: false,
          connected: false,
          upstreamStatus: response.status,
        },
        { status: 502 }
      );
    }

    return Response.json({
      ok: true,
      connected: true,
      upstreamStatus: response.status,
      service: 'eSIM Go',
    });
  } catch {
    return Response.json(
      {
        ok: false,
        connected: false,
        error: 'Could not reach eSIM Go API',
      },
      { status: 502 }
    );
  }
}
