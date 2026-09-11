import { requireAccount } from '../../../lib/auth/session';
import { loadCustomerOrders } from '../../../components/account/customerData';
import { AccountHeading, DataUnavailable, EmptyOrders } from '../../../components/account/AccountStates';
import OrderList from '../../../components/account/OrderList';

export const metadata = { title: 'My orders · MORROWGO' };

export default async function CustomerOrdersPage() {
  const { client, user } = await requireAccount('/account/orders');
  const orders = await loadCustomerOrders(client, user.id);
  return <>
    <AccountHeading title="Every trip, together.">Orders linked to your MORROWGO account. A payment confirmation alone does not mean an eSIM is ready.</AccountHeading>
    {orders.unavailable ? <DataUnavailable label="orders" /> : orders.records.length ? <OrderList orders={orders.records} /> : <EmptyOrders />}
  </>;
}
