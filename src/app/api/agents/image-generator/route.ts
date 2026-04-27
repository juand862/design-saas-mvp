// POST /api/agents/image-generator
// Body: { prompts: ImagePrompts, brand: BrandDNA, copy: CopyByFormat }
// Stub: devuelve placeholders. Reemplazo por Replicate llega en Fase 2B.

import { NextResponse } from 'next/server';
import { generateImages } from '@/lib/agents/image-generator';
import type {
  BrandDNA,
  CopyByFormat,
  ImagePrompts,
} from '@/lib/agents/types';

export const runtime = 'nodejs';
// Replicate puede tardar 10-30s por imagen; con N en paralelo el wall-time
// es ~max(individual). Damos margen suficiente.
export const maxDuration = 90;

export async function POST(request: Request) {
  let payload: { prompts?: ImagePrompts; brand?: BrandDNA; copy?: CopyByFormat };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'Body inválido.' }, { status: 400 });
  }
  if (!payload.prompts || !payload.brand || !payload.copy) {
    return NextResponse.json(
      { ok: false, error: 'Faltan prompts, brand o copy en el body.' },
      { status: 400 },
    );
  }
  const start = Date.now();
  try {
    const images = await generateImages({
      prompts: payload.prompts,
      brand: payload.brand,
      copy: payload.copy,
    });
    return NextResponse.json({
      ok: true,
      data: images,
      meta: { durationMs: Date.now() - start, isStub: true },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
