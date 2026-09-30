import { redirect } from 'next/navigation';
import { requireAccount } from '../../lib/auth/session';
export default async function Page() { await requireAccount('/profile'); redirect('/account/profile'); }
