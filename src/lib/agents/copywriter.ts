// Copywriter — agente 5 del pipeline.
//
// Input: BriefAnalysis + BrandDNA + CreativeConcept + lista de formatos.
// Output: CopyByFormat — un set de copy (headline, subhead, body, cta) por
// cada formato seleccionado. El copy respeta el conceptoCentral y la
// jerarquía visual definida por el Creative Director.

import { runAgent } from '@/lib/agents/anthropic';
import { getAgent } from '@/lib/agents/registry';
import type {
  BrandDNA,
  BriefAnalysis,
  CopyByFormat,
  CreativeConcept,
  FormatCopy,
} from '@/lib/agents/types';
import {
  QUICK_CAMPAIGN_FORMATS,
  type QuickCampaignFormat,
} from '@/lib/types';

export async function writeCopy(input: {
  brief: BriefAnalysis;
  brand: BrandDNA;
  concept: CreativeConcept;
  formats: QuickCampaignFormat[];
}): Promise<{
  copy: CopyByFormat;
  usage: { inputTokens: number; outputTokens: number; cacheReadInputTokens: number };
}> {
  const cfg = getAgent('copywriter');
  const userMessage = formatUserInput(input);
  const result = await runAgent<CopyByFormat>({
    system: cfg.systemPrompt,
    user: userMessage,
    model: cfg.model,
    temperature: cfg.temperature,
    maxTokens: cfg.maxTokens,
  });
  validateCopy(result.data, input.formats);
  return {
    copy: result.data,
    usage: {
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      cacheReadInputTokens: result.usage.cacheReadInputTokens,
    },
  };
}

function formatUserInput(input: {
  brief: BriefAnalysis;
  brand: BrandDNA;
  concept: CreativeConcept;
  formats: QuickCampaignFormat[];
}): string {
  const formatLines = input.formats
    .map((id) => {
      const meta = QUICK_CAMPAIGN_FORMATS.find((f) => f.id === id);
      return `- ${id} (${meta?.label ?? id}, ${meta?.width}×${meta?.height})`;
    })
    .join('\n');

  return `Brief:
- Objetivo: ${input.brief.objetivo}
- Audiencia: ${input.brief.audiencia}
- Tono: ${input.brief.tono}
- CTA base: ${input.brief.cta}
- Restricciones: ${input.brief.restricciones.join('; ') || '(ninguna)'}

Brand DNA:
- Tono de voz: ${input.brand.toneKeywords.join(', ')}

Concepto creativo:
- Central: ${input.concept.conceptoCentral}
- Justificación: ${input.concept.directionJustification}
- Mood: ${input.concept.moodKeywords.join(', ')}

Formatos a escribir:
${formatLines}

Devolvé el JSON con un copy por cada formato del listado.`;
}

function validateCopy(data: unknown, expectedFormats: QuickCampaignFormat[]): asserts data is CopyByFormat {
  if (!data || typeof data !== 'object') throw new Error('Copywriter: respuesta no es un objeto.');
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.pieces)) throw new Error('Copywriter: pieces debe ser array.');
  const seen = new Set<string>();
  for (const piece of d.pieces) {
    if (!piece || typeof piece !== 'object') throw new Error('Copywriter: piece inválido.');
    const p = piece as Record<string, unknown>;
    const required: (keyof FormatCopy)[] = ['format', 'headline', 'subhead', 'body', 'cta'];
    for (const field of required) {
      if (typeof p[field] !== 'string') {
        throw new Error(`Copywriter: piece.${field} debe ser string.`);
      }
    }
    if (!expectedFormats.includes(p.format as QuickCampaignFormat)) {
      throw new Error(`Copywriter: formato "${p.format}" no estaba en el input.`);
    }
    if (seen.has(p.format as string)) {
      throw new Error(`Copywriter: formato "${p.format}" duplicado.`);
    }
    seen.add(p.format as string);
  }
}
