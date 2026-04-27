// GET /api/admin/agents — lista todos los agentes con su config actual.
// Protegido por middleware.

import { NextResponse } from 'next/server';
import { getAllAgents } from '@/lib/agents/registry';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ ok: true, data: getAllAgents() });
}
