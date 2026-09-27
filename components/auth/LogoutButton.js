import { Text } from './../i18n/Provider';
import en from './../../locales/en.json';
import { logoutAction } from '../../lib/auth/actions';

export default function LogoutButton() {
  return <form action={logoutAction}><button type="submit" style={{ color: '#bbb', background: 'transparent', border: '1px solid #333', borderRadius: 99, padding: '10px 18px', cursor: 'pointer', font: 'inherit' }}><Text>{en["m_dc1649a16c14"]}</Text></button></form>;
}
