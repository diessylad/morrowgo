import 'server-only';
import { getCatalogue } from '../../../lib/airalo/catalogue.mjs';
export const dynamic='force-dynamic';
export async function GET(request) {
  const iso=new URL(request.url).searchParams.get('country')?.toUpperCase();
  if(!/^[A-Z]{2}$/.test(iso||''))return Response.json({ok:false,error:'Invalid country'},{status:400});
  try { const c=(await getCatalogue()).find(c=>c.iso===iso);return Response.json({ok:true,sandbox:true,packages:c?.packages||[]}); }
  catch { return Response.json({ok:false,error:'Catalogue temporarily unavailable'},{status:503}); }
}
