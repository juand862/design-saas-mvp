// Brand Analyzer — segundo agente del pipeline.
//
// Toma los inputs de marca del wizard (colores, tipografías, estilos
// elegidos) + referencias visuales (URLs y keywords) y devuelve un BrandDNA
// que normaliza y enriquece esos inputs para que los agentes posteriores
// (Creative Director, Copywriter, Art Director) tengan un brief de identidad
// consistente.
//
// No reemplaza las decisiones del usuario: si eligió #FF6B35 como accent,
// ese valor se preserva. Sí agrega `toneKeywords` (que el wizard no pide)
// y expande `visualStyle` a algo accionable.

import { runAgent } from '@/lib/agents/anthropic';
import { getAgent } from '@/lib/agents/registry';
import type { BrandDNA } from '@/lib/agents/types';
import type { CampaignFormData } from '@/lib/types';

export async function analyzeBrand(input: {
  brand: CampaignFormData['brand'];
  references: CampaignFormData['references'];
}): Promise<{
  dna: BrandDNA;
  usage: { inputTokens: number; outputTokens: number; cacheReadInputTokens: number };
}> {
  const cfg = getAgent('brand-analyzer');
  const userMessage = formatUserInput(input);

  // Si hay imágenes subidas, las pasamos como bloques multimodales al modelo.
  const images = (input.references.images ?? []).map((img) => ({
    mimeType: img.mimeType,
    base64: img.base64,
  }));

  const result = await runAgent<BrandDNA>({
    system: cfg.systemPrompt,
    user: userMessage,
    images: images.length > 0 ? images : undefined,
    model: cfg.model,
    temperature: cfg.temperature,
    maxTokens: cfg.maxTokens,
  });

  validateBrandDNA(result.data);

  return {
    dna: result.data,
    usage: {
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      cacheReadInputTokens: result.usage.cacheReadInputTokens,
    },
  };
}

function formatUserInput({
  brand,
  references,
}: {
  brand: CampaignFormData['brand'];
  references: CampaignFormData['references'];
}): string {
  const urls = references.urls.map((u) => u.trim()).filter(Boolean);
  const keywords = references.keywords.map((k) => k.trim()).filter(Boolean);
  const imageCount = references.images?.length ?? 0;
  const md = brand.guidelinesMarkdown?.trim();

  return `Inputs del wizard:

Colores elegidos:
- Primary: ${brand.colors.primary}
- Secondary: ${brand.colors.secondary}
- Accent: ${brand.colors.accent}

Tipografías elegidas:
- Headline: ${brand.typography.headline}
- Body: ${brand.typography.body}

Estilos visuales elegidos: ${brand.style.length > 0 ? brand.style.join(', ') : '(ninguno seleccionado)'}

Referencias visuales:
- URLs: ${urls.length > 0 ? urls.join(', ') : '(ninguna)'}
- Keywords: ${keywords.length > 0 ? keywords.join(', ') : '(ninguna)'}
- Imágenes adjuntas: ${imageCount > 0 ? `${imageCount} (analizalas visualmente — están en los bloques anteriores)` : '(ninguna)'}

${md ? `Guidelines de marca (markdown adjunto del usuario — TIENE PRIORIDAD sobre los inputs sueltos cuando haya conflicto):\n---\n${md}\n---\n` : 'Sin guidelines en markdown adjuntos.'}

Consolidá esto en un Brand DNA según el schema. Si las imágenes muestran logos o piezas de la marca, extraé colores y estilo de ahí (verificá los hex del usuario contra lo que ves; si difieren mucho, mantené los del usuario pero reflejá el patrón visual real en visualStyle).`;
}

function validateBrandDNA(data: unknown): asserts data is BrandDNA {
  if (!data || typeof data !== 'object') {
    throw new Error('Brand Analyzer: respuesta no es un objeto.');
  }
  const d = data as Record<string, unknown>;
  const palette = d.colorPalette as Record<string, unknown> | undefined;
  if (!palette || typeof palette.primary !== 'string' || typeof palette.secondary !== 'string' || typeof palette.accent !== 'string') {
    throw new Error('Brand Analyzer: colorPalette inválido.');
  }
  const typography = d.typography as Record<string, unknown> | undefined;
  if (!typography || typeof typography.headline !== 'string' || typeof typography.body !== 'string') {
    throw new Error('Brand Analyzer: typography inválido.');
  }
  if (!Array.isArray(d.visualStyle) || !d.visualStyle.every((s) => typeof s === 'string')) {
    throw new Error('Brand Analyzer: visualStyle debe ser string[].');
  }
  if (!Array.isArray(d.toneKeywords) || !d.toneKeywords.every((s) => typeof s === 'string')) {
    throw new Error('Brand Analyzer: toneKeywords debe ser string[].');
  }
}
