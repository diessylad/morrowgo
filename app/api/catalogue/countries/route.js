import 'server-only';
import { getCatalogue } from '../../../../lib/airalo/catalogue.mjs';
export const dynamic='force-dynamic';
export async function GET() {
  try { const countries=(await getCatalogue()).map(({packages,...country})=>country);return Response.json({ok:true,sandbox:true,countries}); }
  catch {return Response.json({ok:false,error:'Catalogue temporarily unavailable'},{status:503});}
}
