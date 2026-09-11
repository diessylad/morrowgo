import { accountJson, verifiedApiAccount } from '../../../../../lib/account/api';
import { readCustomerEsim } from '../../../../../lib/account/readers';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  const account = await verifiedApiAccount();
  if (account.response) return account.response;
  const result = await readCustomerEsim(account.client, account.user.id, params.id);
  if (result.error === 'invalid_id') return accountJson({ error: 'not_found' }, 404);
  if (result.error) return accountJson({ error: 'account_data_unavailable' }, 503);
  if (!result.data) return accountJson({ error: 'not_found' }, 404);
  return accountJson({ esim: result.data });
}
