// POST /api/generate — orquestador del pipeline completo.
//
// Body: { campaign: CampaignFormData }
// Response: { ok: true, data: CampaignGeneration } | { ok: false, error }
//
// Corre los 8 agentes en secuencia:
//   1. Brief Analyst         (LLM)
//   2. Brand Analyzer        (LLM, multimodal si hay imágenes)
//   3. Brand Historian       (stub — Fase 3)
//   4. Creative Director     (LLM)
//   5. Copywriter            (LLM)
//   6. Art Director          (LLM, multimodal si hay imágenes de referencia)
//   7. Image Generation      (Replicate — Flux Dev por defecto)
//   8. Layout Composer       — saltado (la UI compone en HTML hasta Fase 2C)
//
// Sin streaming. Una sola respuesta cuando todo termina (~60-90s típicamente,
// depende del modelo Replicate y cantidad de imágenes).

import { NextResponse } from 'next/server';
import { analyzeBrief } from '@/lib/agents/brief-analyst';
import { analyzeBrand } from '@/lib/agents/brand-analyzer';
import { analyzeHistory } from '@/lib/agents/brand-historian';
import { directConcept } from '@/lib/agents/creative-director';
import { writeCopy } from '@/lib/agents/copywriter';
import { directArt } from '@/lib/agents/art-director';
import { generateImages } from '@/lib/agents/image-generator';
import { MODELS } from '@/lib/agents/anthropic';
import type { CampaignGeneration } from '@/lib/agents/types';
import type { CampaignFormData } from '@/lib/types';

export const runtime = 'nodejs';
// Pipeline largo: 5 LLMs en serie + generación de imágenes Replicate.
export const maxDuration = 180;

export async function POST(request: Request) {
  let payload: { campaign?: CampaignFormData };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Body inválido: se esperaba JSON.' },
      { status: 400 },
    );
  }

  const error = validateCampaignShape(payload?.campaign);
  if (error) {
    return NextResponse.json({ ok: false, error }, { status: 400 });
  }
  const campaign = payload.campaign!;

  const start = Date.now();
  const stubsUsed: string[] = [];

  try {
    const briefRes = await analyzeBrief(campaign.brief);
    const brandRes = await analyzeBrand({
      brand: campaign.brand,
      references: campaign.references,
    });
    const historyRes = await analyzeHistory();
    if (historyRes.insights.isStub) stubsUsed.push('brand-historian');

    const conceptRes = await directConcept({
      brief: briefRes.analysis,
      brand: brandRes.dna,
      history: historyRes.insights,
    });
    const copyRes = await writeCopy({
      brief: briefRes.analysis,
      brand: brandRes.dna,
      concept: conceptRes.concept,
      formats: campaign.output.formats,
    });
    const artRes = await directArt({
      brief: briefRes.analysis,
      brand: brandRes.dna,
      concept: conceptRes.concept,
      copy: copyRes.copy,
      formats: campaign.output.formats,
      variationsPerFormat: campaign.output.variationsPerFormat,
      referenceImages: campaign.references.images,
    });

    const images = await generateImages({
      prompts: artRes.prompts,
      brand: brandRes.dna,
      copy: copyRes.copy,
    });
    if (images.images.some((i) => i.isPlaceholder)) {
      stubsUsed.push('image-generation (fallback)');
    }
    stubsUsed.push('layout-composer');

    const result: CampaignGeneration = {
      input: campaign,
      brief: briefRes.analysis,
      brand: brandRes.dna,
      history: historyRes.insights,
      concept: conceptRes.concept,
      copy: copyRes.copy,
      imagePrompts: artRes.prompts,
      images,
      meta: {
        durationMs: Date.now() - start,
        model: MODELS.sonnet,
        generatedAt: new Date().toISOString(),
        stubsUsed,
      },
    };

    return NextResponse.json({ ok: true, data: result });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido.';
    console.error('[generate] fallo:', err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

function validateCampaignShape(campaign: unknown): string | null {
  if (!campaign || typeof campaign !== 'object') return 'Falta el campo "campaign".';
  const c = campaign as Record<string, unknown>;
  if (!c.brief || typeof c.brief !== 'object') return 'campaign.brief inválido.';
  if (!c.brand || typeof c.brand !== 'object') return 'campaign.brand inválido.';
  if (!c.references || typeof c.references !== 'object') return 'campaign.references inválido.';
  if (!c.output || typeof c.output !== 'object') return 'campaign.output inválido.';
  const output = c.output as Record<string, unknown>;
  if (!Array.isArray(output.formats) || output.formats.length === 0) {
    return 'campaign.output.formats debe ser array no vacío.';
  }
  if (typeof output.variationsPerFormat !== 'number' || output.variationsPerFormat < 1) {
    return 'campaign.output.variationsPerFormat debe ser número >= 1.';
  }
  return null;
}
