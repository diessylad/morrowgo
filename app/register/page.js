import AuthForm from '../../components/auth/AuthForm';
import { getAuthConfig, safeAccountPath } from '../../lib/auth/config.mjs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Create account · MORROWGO', robots: { index: false, follow: false } };
export default function RegisterPage({ searchParams }) { return <AuthForm mode="register" configured={Boolean(getAuthConfig())} next={safeAccountPath(searchParams?.next)} emailInitiallyOpen={searchParams?.method === 'email'} />; }
