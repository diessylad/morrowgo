import { logoutAction } from '../../lib/auth/actions';

export default function LogoutButton() {
  return <form action={logoutAction}><button type="submit" style={{ color: '#bbb', background: 'transparent', border: '1px solid #333', borderRadius: 99, padding: '10px 18px', cursor: 'pointer', font: 'inherit' }}>Sign out</button></form>;
}
