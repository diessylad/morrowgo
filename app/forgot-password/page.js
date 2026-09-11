import AuthForm from '../../components/auth/AuthForm';
import { getAuthConfig } from '../../lib/auth/config.mjs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Reset access · MORROWGO', robots: { index: false, follow: false } };
export default function ForgotPasswordPage() { return <AuthForm mode="forgot" configured={Boolean(getAuthConfig())} />; }
