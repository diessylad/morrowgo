import AuthForm from '../../components/auth/AuthForm';
import { getAuthConfig, safeAccountPath } from '../../lib/auth/config.mjs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Sign in · MORROWGO', robots: { index: false, follow: false } };
export default function LoginPage({ searchParams }) {
  return <AuthForm mode="login" configured={Boolean(getAuthConfig())} next={safeAccountPath(searchParams?.next)} message={searchParams?.message} />;
}
