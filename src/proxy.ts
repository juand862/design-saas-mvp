// Proxy de Next 16 (antes "middleware"): protege /admin/* y /api/admin/*
// con session cookie. Edge runtime — sin Node APIs.

import { NextResponse, type NextRequest } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  verifySessionCookieValue,
} from '@/lib/admin/auth';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Endpoints/páginas que NO requieren auth (la propia ruta de login).
  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const user = await verifySessionCookieValue(cookie);

  if (!user) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ ok: false, error: 'No autorizado.' }, { status: 401 });
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
