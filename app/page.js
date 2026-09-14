import Experience from '../components/studio/Experience';
import { getVerifiedAccount } from '../lib/auth/session';
export default async function HomePage() { const { user } = await getVerifiedAccount(); return <Experience authenticated={!!user} />; }
