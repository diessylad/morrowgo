import {
  createEsimGoTransaction,
  getEsimInstallDetails
} from '../../../../lib/esimgoFulfillment';

export const dynamic = 'force-dynamic';

export async function GET() {
  const enabled =
    String(
      process.env
        .ESIM_GO_FULFILLMENT_ENABLED ||
      ''
    ).toLowerCase() === 'true';

  return Response.json({
    ok: true,
    moduleReady:
      typeof createEsimGoTransaction ===
        'function' &&
      typeof getEsimInstallDetails ===
        'function',
    fulfillmentEnabled:
      enabled
  });
}
