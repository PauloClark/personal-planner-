import { redirect } from 'next/navigation';
import { isConfigured } from '@/lib/supabase/config';
import { createClient } from '@/lib/supabase/server';
import { PlannerProvider } from '@/components/planner-provider';
import { AppShell } from '@/components/layout/app-shell';
export default async function PlannerLayout({children}: {children: React.ReactNode}) {
  if (!isConfigured()) redirect('/login');
  const client = await createClient();
  const {data: {user}} = await client.auth.getUser();
  if (!user) redirect('/login');
  // Capture once on the authenticated server request, then serialize for hydration.
  // eslint-disable-next-line react-hooks/purity
  const initialNow = Date.now();
  return <PlannerProvider initialNow={initialNow} user={{id: user.id, email: user.email ?? ''}}><AppShell>{children}</AppShell></PlannerProvider>;
}
