// POST /api/agents/brand-analyzer
//
// Body: { brand: CampaignFormData['brand'], references: CampaignFormData['references'] }
// Response: { ok: true, data: BrandDNA, meta: { durationMs, usage } }
//         | { ok: false, error: string }

import { NextResponse } from 'next/server';
import { analyzeBrand } from '@/lib/agents/brand-analyzer';
import type { CampaignFormData } from '@/lib/types';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  let payload: {
    brand?: CampaignFormData['brand'];
    references?: CampaignFormData['references'];
  };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Body inválido: se esperaba JSON.' },
      { status: 400 },
    );
  }

  const error = validateInputShape(payload);
  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }

  const start = Date.now();
  try {
    const { dna, usage } = await analyzeBrand({
      brand: payload.brand!,
      references: payload.references!,
    });
    return NextResponse.json({
      ok: true,
      data: dna,
      meta: {
        durationMs: Date.now() - start,
        usage,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido.';
    console.error('[brand-analyzer] fallo:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

function validateInputShape(payload: {
  brand?: unknown;
  references?: unknown;
}): string | null {
  const brand = payload.brand as Record<string, unknown> | undefined;
  if (!brand || typeof brand !== 'object') {
    return 'Falta el campo "brand".';
  }
  const colors = brand.colors as Record<string, unknown> | undefined;
  if (!colors || typeof colors.primary !== 'string' || typeof colors.secondary !== 'string' || typeof colors.accent !== 'string') {
    return 'brand.colors debe tener primary, secondary y accent (strings).';
  }
  const typography = brand.typography as Record<string, unknown> | undefined;
  if (!typography || typeof typography.headline !== 'string' || typeof typography.body !== 'string') {
    return 'brand.typography debe tener headline y body (strings).';
  }
  if (!Array.isArray(brand.style) || !brand.style.every((s) => typeof s === 'string')) {
    return 'brand.style debe ser string[].';
  }

  const references = payload.references as Record<string, unknown> | undefined;
  if (!references || typeof references !== 'object') {
    return 'Falta el campo "references".';
  }
  if (!Array.isArray(references.urls) || !references.urls.every((u) => typeof u === 'string')) {
    return 'references.urls debe ser string[].';
  }
  if (!Array.isArray(references.keywords) || !references.keywords.every((k) => typeof k === 'string')) {
    return 'references.keywords debe ser string[].';
  }
  return null;
}
