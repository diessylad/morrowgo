import { accountJson, verifiedApiAccount } from '../../../../lib/account/api';
import { readCustomerOrders } from '../../../../lib/account/readers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const account = await verifiedApiAccount();
  if (account.response) return account.response;
  const result = await readCustomerOrders(account.client, account.user.id);
  return result.error ? accountJson({ error: 'account_data_unavailable' }, 503) : accountJson({ orders: result.data });
}
