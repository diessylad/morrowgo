import { Text } from './../../../components/i18n/Provider';
import en from './../../../locales/en.json';
import { requireAccount } from '../../../lib/auth/session';
import { loadCustomerOrders } from '../../../components/account/customerData';
import { AccountHeading, DataUnavailable, EmptyOrders } from '../../../components/account/AccountStates';
import OrderList from '../../../components/account/OrderList';

export const metadata = { title: 'My orders · MORROWGO' };

export default async function CustomerOrdersPage() {
  const { client, user } = await requireAccount('/account/orders');
  const orders = await loadCustomerOrders(client, user.id);
  return <>
    <AccountHeading title={en["m_acff71ba12bf"]}><Text>{en["m_3c701e688031"]}</Text></AccountHeading>
    <Text>{orders.unavailable ? <DataUnavailable label={en["m_965840381640"]} /> : orders.records.length ? <OrderList orders={orders.records} /> : <EmptyOrders />}</Text>
  </>;
}
