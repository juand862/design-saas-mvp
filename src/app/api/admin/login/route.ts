// POST /api/admin/login
// Body: { username: string, password: string }
// Response: { ok: true } | { ok: false, error }
// Setea cookie httponly tras verificar credenciales.

import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  buildSessionCookieValue,
  verifyCredentials,
} from '@/lib/admin/auth';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let payload: { username?: unknown; password?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Body inválido: se esperaba JSON.' },
      { status: 400 },
    );
  }

  if (typeof payload.username !== 'string' || typeof payload.password !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'username y password deben ser strings.' },
      { status: 400 },
    );
  }

  if (!verifyCredentials(payload.username, payload.password)) {
    return NextResponse.json(
      { ok: false, error: 'Credenciales inválidas.' },
      { status: 401 },
    );
  }

  const value = await buildSessionCookieValue(payload.username);
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  return response;
}
