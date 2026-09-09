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

export async function GET() {
  const { url, token } =
    getRedisConfig();

  if (!url || !token) {
    return Response.json(
      {
        ok: false,
        connected: false,
        error:
          'Redis environment variables are not configured'
      },
      {
        status: 500
      }
    );
  }

  try {
    const response = await fetch(
      url,
      {
        method: 'POST',

        headers: {
          Authorization:
            `Bearer ${token}`,

          'Content-Type':
            'application/json'
        },

        body:
          JSON.stringify([
            'PING'
          ]),

        cache: 'no-store'
      }
    );

    const data =
      await response
        .json()
        .catch(() => null);

    if (!response.ok) {
      return Response.json(
        {
          ok: false,
          connected: false,
          upstreamStatus:
            response.status
        },
        {
          status: 502
        }
      );
    }

    return Response.json({
      ok: true,
      connected:
        data?.result === 'PONG',
      service:
        'Upstash Redis'
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        connected: false,
        error:
          error?.message ||
          'Redis connection failed'
      },
      {
        status: 500
      }
    );
  }
}
