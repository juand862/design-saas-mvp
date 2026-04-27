// POST /api/agents/art-director
// Body: { brief, brand, concept, copy, formats, variationsPerFormat }

import { NextResponse } from 'next/server';
import { directArt } from '@/lib/agents/art-director';
import type {
  BrandDNA,
  BriefAnalysis,
  CopyByFormat,
  CreativeConcept,
} from '@/lib/agents/types';
import type { QuickCampaignFormat } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let payload: {
    brief?: BriefAnalysis;
    brand?: BrandDNA;
    concept?: CreativeConcept;
    copy?: CopyByFormat;
    formats?: QuickCampaignFormat[];
    variationsPerFormat?: number;
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Body inválido.' }, { status: 400 });
  }
  if (!payload.brief || !payload.brand || !payload.concept || !payload.copy) {
    return NextResponse.json(
      { ok: false, error: 'Faltan brief, brand, concept o copy en el body.' },
      { status: 400 },
    );
  }
  if (!Array.isArray(payload.formats) || payload.formats.length === 0) {
    return NextResponse.json(
      { ok: false, error: 'formats debe ser array no vacío.' },
      { status: 400 },
    );
  }
  if (typeof payload.variationsPerFormat !== 'number' || payload.variationsPerFormat < 1) {
    return NextResponse.json(
      { ok: false, error: 'variationsPerFormat debe ser número >= 1.' },
      { status: 400 },
    );
  }
  const start = Date.now();
  try {
    const { prompts, usage } = await directArt({
      brief: payload.brief,
      brand: payload.brand,
      concept: payload.concept,
      copy: payload.copy,
      formats: payload.formats,
      variationsPerFormat: payload.variationsPerFormat,
    });
    return NextResponse.json({
      ok: true,
      data: prompts,
      meta: { durationMs: Date.now() - start, usage },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido.';
    console.error('[art-director] fallo:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
