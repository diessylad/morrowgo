import { Text } from './../../components/i18n/Provider';
import { requireAccount } from '../../lib/auth/session';
import { accountProfile } from '../../lib/account/presentation.mjs';
import AccountShell from '../../components/account/AccountShell';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My MORROWGO', robots: { index: false, follow: false } };

export default async function AccountLayout({ children }) {
  const { user } = await requireAccount('/account');
  return <AccountShell profile={accountProfile(user)}><Text>{children}</Text></AccountShell>;
}
