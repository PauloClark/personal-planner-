import { RegisterForm } from '@/components/register-form';
import { isConfigured } from '@/lib/supabase/config';
export default function RegisterPage() { return <RegisterForm configured={isConfigured()}/>; }