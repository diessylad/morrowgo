import 'server-only';
import { getCatalogue } from '../../../../lib/airalo/catalogue.mjs';
import { selectNetworkBrands } from '../../../../lib/airalo/networkBrands.mjs';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    return Response.json({ networks: selectNetworkBrands(await getCatalogue()) });
  } catch {
    return Response.json({ networks: [] }, { status: 503 });
  }
}
