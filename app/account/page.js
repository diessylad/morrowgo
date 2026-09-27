import { requireAccount } from '../../lib/auth/session';
import { loadCustomerEsims, loadCustomerOrders } from '../../components/account/customerData';
import DashboardOverview from '../../components/account/DashboardOverview';
import { accountProfile } from '../../lib/account/presentation.mjs';

export default async function AccountPage() {
  const { client, user } = await requireAccount('/account');
  const [esims, orders] = await Promise.all([
    loadCustomerEsims(client, user.id),
    loadCustomerOrders(client, user.id)
  ]);
  return <DashboardOverview esims={esims.records} orders={orders.records} esimsUnavailable={esims.unavailable} ordersUnavailable={orders.unavailable} profile={accountProfile(user)} asOf={new Date().toISOString()}/>;
}
