// POST /api/agents/brief-analyst
//
// Body: { brief: CampaignFormData['brief'] }
// Response: { ok: true, data: BriefAnalysis, meta: { durationMs, usage } }
//         | { ok: false, error: string }
//
// Endpoint individual del Brief Analyst — útil para debug y para iterar el
// prompt sin arrastrar el resto del pipeline. La ruta `/api/generate`
// (sub-paso 4) lo llamará internamente sin pasar por HTTP.

import { NextResponse } from 'next/server';
import { analyzeBrief } from '@/lib/agents/brief-analyst';
import type { CampaignFormData } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let payload: { brief?: CampaignFormData['brief'] };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Body inválido: se esperaba JSON.' },
      { status: 400 },
    );
  }

  const briefError = validateBriefShape(payload?.brief);
  if (briefError) {
    return NextResponse.json({ ok: false, error: briefError }, { status: 400 });
  }

  const start = Date.now();
  try {
    const { analysis, usage } = await analyzeBrief(payload.brief!);
    return NextResponse.json({
      ok: true,
      data: analysis,
      meta: {
        durationMs: Date.now() - start,
        usage,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido.';
    console.error('[brief-analyst] fallo:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

function validateBriefShape(brief: unknown): string | null {
  if (!brief || typeof brief !== 'object') {
    return 'Falta el campo "brief" (objeto con datos del Step 1 del wizard).';
  }
  const b = brief as Record<string, unknown>;
  const stringFields = ['objetivo', 'audiencia', 'tono', 'ocasion', 'cta', 'campaignType'];
  for (const field of stringFields) {
    if (typeof b[field] !== 'string') {
      return `Campo "brief.${field}" debe ser string.`;
    }
  }
  if (!Array.isArray(b.restricciones) || !b.restricciones.every((r) => typeof r === 'string')) {
    return 'Campo "brief.restricciones" debe ser string[].';
  }
  return null;
}
