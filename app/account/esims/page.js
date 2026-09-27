import { Text } from './../../../components/i18n/Provider';
import en from './../../../locales/en.json';
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
    <AccountHeading title={en["m_d7b48a1a9bb8"]}><Text>{en["m_e69035b029cc"]}</Text></AccountHeading>
    {esims.unavailable ? <DataUnavailable label="eSIMs" /> : esims.records.length ? <div className={styles.grid}>{esims.records.map(esim => <EsimCard key={esim.id} esim={esim} usage={usagePresentation(esim)} />)}</div> : <EmptyEsims />}
  </>;
}
