// POST /api/agents/copywriter
// Body: { brief: BriefAnalysis, brand: BrandDNA, concept: CreativeConcept, formats: QuickCampaignFormat[] }

import { NextResponse } from 'next/server';
import { writeCopy } from '@/lib/agents/copywriter';
import type {
  BrandDNA,
  BriefAnalysis,
  CreativeConcept,
} from '@/lib/agents/types';
import type { QuickCampaignFormat } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let payload: {
    brief?: BriefAnalysis;
    brand?: BrandDNA;
    concept?: CreativeConcept;
    formats?: QuickCampaignFormat[];
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Body inválido.' }, { status: 400 });
  }
  if (!payload.brief || !payload.brand || !payload.concept) {
    return NextResponse.json(
      { ok: false, error: 'Faltan brief, brand o concept en el body.' },
      { status: 400 },
    );
  }
  if (!Array.isArray(payload.formats) || payload.formats.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'formats debe ser array no vacío.' },
      { status: 400 },
    );
  }
  const start = Date.now();
  try {
    const { copy, usage } = await writeCopy({
      brief: payload.brief,
      brand: payload.brand,
      concept: payload.concept,
      formats: payload.formats,
    });
    return NextResponse.json({
      ok: true,
      data: copy,
      meta: { durationMs: Date.now() - start, usage },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido.';
    console.error('[copywriter] fallo:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
