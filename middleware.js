import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySessionToken } from './lib/session';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isLoginPage = pathname === '/login';
  const isAuthApi = pathname.startsWith('/api/auth/');

  if (!session && !isLoginPage && !isAuthApi) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
