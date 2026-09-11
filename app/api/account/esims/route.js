import { accountJson, verifiedApiAccount } from '../../../../lib/account/api';
import { readCustomerEsims } from '../../../../lib/account/readers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const account = await verifiedApiAccount();
  if (account.response) return account.response;
  const result = await readCustomerEsims(account.client, account.user.id);
  return result.error ? accountJson({ error: 'account_data_unavailable' }, 503) : accountJson({ esims: result.data });
}
