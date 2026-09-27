import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isConfigured } from '@/lib/supabase/config';
export async function proxy(request: NextRequest) {
  const login = request.nextUrl.pathname === '/login';
  if (!isConfigured()) return login ? NextResponse.next() : NextResponse.redirect(new URL('/login', request.url));
  let response = NextResponse.next({request});
  const client = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {cookies: {
    getAll: () => request.cookies.getAll(),
    setAll(values) { values.forEach(({name, value}) => request.cookies.set(name, value)); response = NextResponse.next({request}); values.forEach(({name, value, options}) => response.cookies.set(name, value, options)); },
  }});
  const {data, error} = await client.auth.getUser();
  if ((!data.user || error) && !login || (data.user && !error && login)) {
    const redirect = NextResponse.redirect(new URL(login ? '/dashboard' : '/login', request.url));
    response.cookies.getAll().forEach(cookie => redirect.cookies.set(cookie));
    response = redirect;
  }
  response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/dashboard/:path*', '/calendar/:path*', '/tasks/:path*', '/settings/:path*', '/login'] };
