import { requireAccount } from '../../lib/auth/session';
import { loadCustomerEsims, loadCustomerOrders, usagePresentation } from '../../components/account/customerData';
import DashboardOverview from '../../components/account/DashboardOverview';
import EsimCard from '../../components/account/EsimCard';

export default async function AccountPage() {
  const { client, user } = await requireAccount('/account');
  const [esims, orders] = await Promise.all([
    loadCustomerEsims(client, user.id),
    loadCustomerOrders(client, user.id)
  ]);
  return <DashboardOverview esims={esims.records} orders={orders.records} esimsUnavailable={esims.unavailable} ordersUnavailable={orders.unavailable} esimCards={esims.records.slice(0, 2).map(esim => <EsimCard key={esim.id} esim={esim} usage={usagePresentation(esim)} />)} />;
}
