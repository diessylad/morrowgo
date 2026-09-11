import { requireAccount } from '../../../lib/auth/session';
import { loadCustomerEsims, usagePresentation } from '../../../components/account/customerData';
import { AccountHeading, DataUnavailable, EmptyEsims } from '../../../components/account/AccountStates';
import EsimCard from '../../../components/account/EsimCard';
import styles from '../../../components/account/account.module.css';

export const metadata = { title: 'My eSIMs · MORROWGO' };

export default async function CustomerEsimsPage() {
  const { client, user } = await requireAccount('/account/esims');
  const esims = await loadCustomerEsims(client, user.id);
  return <>
    <AccountHeading title="Your connections.">Your plans, installation details and the latest available data readings.</AccountHeading>
    {esims.unavailable ? <DataUnavailable label="eSIMs" /> : esims.records.length ? <div className={styles.grid}>{esims.records.map(esim => <EsimCard key={esim.id} esim={esim} usage={usagePresentation(esim)} />)}</div> : <EmptyEsims />}
  </>;
}
