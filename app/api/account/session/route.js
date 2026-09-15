import {getVerifiedAccount} from '../../../../lib/auth/session';
export const dynamic='force-dynamic';
export async function GET(){const {user}=await getVerifiedAccount();return Response.json({authenticated:!!user},{headers:{'Cache-Control':'private, no-store'}});}
