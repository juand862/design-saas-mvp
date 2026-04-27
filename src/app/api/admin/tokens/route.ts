// GET /api/admin/tokens — devuelve estado de cada token enmascarado.
// PATCH /api/admin/tokens — body { name: 'anthropic'|'replicate', value: string|null }
//   value: null → restaurar al valor de env. string → setear override.
// Protegido por proxy.

import { NextResponse } from 'next/server';
import { getTokenStatuses, setToken } from '@/lib/admin/tokens';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ ok: true, data: getTokenStatuses() });
}

export async function PATCH(request: Request) {
  let payload: { name?: unknown; value?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Body inválido.' }, { status: 400 });
  }

  if (payload.name !== 'anthropic' && payload.name !== 'replicate') {
    return NextResponse.json(
      { ok: false, error: 'name debe ser "anthropic" o "replicate".' },
      { status: 400 },
    );
  }
  if (payload.value !== null && typeof payload.value !== 'string') {
    return NextResponse.json(
      { ok: false, error: 'value debe ser string o null.' },
      { status: 400 },
    );
  }

  try {
    setToken(payload.name, payload.value as string | null);
    return NextResponse.json({ ok: true, data: getTokenStatuses() });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido.';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
