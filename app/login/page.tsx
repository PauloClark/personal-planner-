import { LoginForm } from '@/components/login-form';
import { isConfigured } from '@/lib/supabase/config';
export default function LoginPage() { return <LoginForm configured={isConfigured()}/>; }
