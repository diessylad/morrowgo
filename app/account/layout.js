import { requireAccount } from '../../lib/auth/session';
import AccountShell from '../../components/account/AccountShell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My MORROWGO', robots: { index: false, follow: false } };

export default async function AccountLayout({ children }) {
  await requireAccount('/account');
  return <AccountShell>{children}</AccountShell>;
}
