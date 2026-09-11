import AuthForm from '../../components/auth/AuthForm';
import { getAuthConfig, validRecoveryToken } from '../../lib/auth/config.mjs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'New password · MORROWGO', robots: { index: false, follow: false }, referrer: 'no-referrer' };
export default function ResetPasswordPage({ searchParams }) { return <AuthForm mode="reset" configured={Boolean(getAuthConfig())} tokenHash={validRecoveryToken(searchParams?.token_hash) ? searchParams.token_hash : ''} />; }
