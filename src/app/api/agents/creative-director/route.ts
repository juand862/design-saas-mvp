// POST /api/agents/creative-director
// Body: { brief: BriefAnalysis, brand: BrandDNA, history: BrandHistorianInsights }
// Response: { ok: true, data: CreativeConcept, meta: { durationMs, usage } }

import { NextResponse } from 'next/server';
import { directConcept } from '@/lib/agents/creative-director';
import type {
  BrandDNA,
  BrandHistorianInsights,
  BriefAnalysis,
} from '@/lib/agents/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let payload: { brief?: BriefAnalysis; brand?: BrandDNA; history?: BrandHistorianInsights };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Body inválido.' }, { status: 400 });
  }
  if (!payload.brief || !payload.brand || !payload.history) {
    return NextResponse.json(
      { ok: false, error: 'Faltan brief, brand o history en el body.' },
      { status: 400 },
    );
  }
  const start = Date.now();
  try {
    const { concept, usage } = await directConcept({
      brief: payload.brief,
      brand: payload.brand,
      history: payload.history,
    });
    return NextResponse.json({
      ok: true,
      data: concept,
      meta: { durationMs: Date.now() - start, usage },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido.';
    console.error('[creative-director] fallo:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
