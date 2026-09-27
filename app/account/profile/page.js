import { requireAccount } from '../../../lib/auth/session';
import { accountProfile } from '../../../lib/account/presentation.mjs';
import ProfileForm from '../../../components/account/ProfileForm';
export const metadata = { title: 'Profile · MORROWGO' };
export default async function ProfilePage() {
 const { user } = await requireAccount('/account/profile');
 return <ProfileForm profile={accountProfile(user)}/>;
}
