import { Text } from './../../../components/i18n/Provider';
import en from './../../../locales/en.json';
import { requireAccount } from '../../../lib/auth/session';
import { loadCustomerEsims, usagePresentation } from '../../../components/account/customerData';
import { AccountHeading, DataUnavailable, EmptyEsims } from '../../../components/account/AccountStates';
import { readCustomerOrders } from '../../../lib/account/readers';
import PendingEsims from '../../../components/account/PendingEsims';
import EsimCard from '../../../components/account/EsimCard';
import EsimCollection from '../../../components/account/EsimCollection';
import styles from '../../../components/account/account.module.css';

export const metadata = { title: 'My eSIMs · MORROWGO' };

export default async function CustomerEsimsPage({ searchParams }) {
  const { client, user } = await requireAccount('/account/esims');
  const esims = await loadCustomerEsims(client, user.id);
  const orders = await readCustomerOrders(client, user.id);
  const asOf=new Date().toISOString();
  const pending = orders.data?.some(order => ['paid','processing','awaiting_fulfillment'].includes(order.status));
  return <>
    {pending && <PendingEsims />}
    <AccountHeading title={en["m_d7b48a1a9bb8"]}><Text>{en["m_e69035b029cc"]}</Text></AccountHeading>
    {esims.unavailable ? <DataUnavailable label="eSIMs" /> : esims.records.length ? <EsimCollection esims={esims.records} asOf={asOf}>{esims.records.map(esim => <EsimCard key={esim.id} esim={esim} usage={usagePresentation(esim)} installationOpen={searchParams?.install === esim.id} topUpInitiallyOpen={searchParams?.topup === esim.id} asOf={asOf} />)}</EsimCollection> : <EmptyEsims />}
  </>;
}
