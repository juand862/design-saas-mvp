// GET /api/admin/agents/[id] — config actual del agente
// PATCH /api/admin/agents/[id] — actualiza systemPrompt/model/temperature/maxTokens
// Protegido por middleware.

import { NextResponse } from 'next/server';
import {
  getAgent,
  isValidAgentId,
  resetAgent,
  updateAgent,
  type AgentEditableFields,
  type AgentId,
} from '@/lib/agents/registry';

export const runtime = 'nodejs';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, ctx: Params) {
  const { id } = await ctx.params;
  if (!isValidAgentId(id)) {
    return NextResponse.json({ ok: false, error: 'Agent no encontrado.' }, { status: 404 });
  }
  return NextResponse.json({ ok: true, data: getAgent(id) });
}

export async function PATCH(request: Request, ctx: Params) {
  const { id } = await ctx.params;
  if (!isValidAgentId(id)) {
    return NextResponse.json({ ok: false, error: 'Agent no encontrado.' }, { status: 404 });
  }

  let payload: Partial<AgentEditableFields> & { reset?: boolean };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Body inválido.' }, { status: 400 });
  }

  try {
    if (payload.reset) {
      const reset = resetAgent(id as AgentId);
      return NextResponse.json({ ok: true, data: reset });
    }
    const updated = updateAgent(id as AgentId, payload);
    return NextResponse.json({ ok: true, data: updated });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido.';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
