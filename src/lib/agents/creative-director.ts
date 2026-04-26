// Creative Director — agente 4 del pipeline. Núcleo creativo de Canvas SaaS.
//
// Input: BriefAnalysis + BrandDNA + BrandHistorianInsights (stub hoy).
// Output: CreativeConcept con concepto central + paleta evolucionada +
// jerarquía visual + mood keywords. Es el "concepto creativo" que después
// guía a Copywriter y Art Director.
//
// Decisión de modelo: Sonnet 4.6 por ahora. Si el output es genérico,
// subir a Opus 4.7 — este es el agente más sensible a calidad del modelo.

import { runAgent } from '@/lib/agents/anthropic';
import { getAgent } from '@/lib/agents/registry';
import type {
  BrandDNA,
  BrandHistorianInsights,
  BriefAnalysis,
  CreativeConcept,
} from '@/lib/agents/types';

export async function directConcept(input: {
  brief: BriefAnalysis;
  brand: BrandDNA;
  history: BrandHistorianInsights;
}): Promise<{
  concept: CreativeConcept;
  usage: { inputTokens: number; outputTokens: number; cacheReadInputTokens: number };
}> {
  const cfg = getAgent('creative-director');
  const userMessage = formatUserInput(input);
  const result = await runAgent<CreativeConcept>({
    system: cfg.systemPrompt,
    user: userMessage,
    model: cfg.model,
    temperature: cfg.temperature,
    maxTokens: cfg.maxTokens,
  });
  validateConcept(result.data);
  return {
    concept: result.data,
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
  history: BrandHistorianInsights;
}): string {
  return `Brief refinado:
- Objetivo: ${input.brief.objetivo}
- Audiencia: ${input.brief.audiencia}
- Tono buscado: ${input.brief.tono}
- Ocasión: ${input.brief.ocasion}
- CTA: ${input.brief.cta}
- Restricciones: ${input.brief.restricciones.join('; ') || '(ninguna)'}
- Insights del Brief Analyst: ${input.brief.insightsAdicionales.join(' | ')}

Brand DNA:
- Paleta: primary ${input.brand.colorPalette.primary}, secondary ${input.brand.colorPalette.secondary}, accent ${input.brand.colorPalette.accent}
- Tipografía: headline "${input.brand.typography.headline}", body "${input.brand.typography.body}"
- Estilo visual: ${input.brand.visualStyle.join(', ')}
- Tono de voz: ${input.brand.toneKeywords.join(', ')}

Insights históricos: ${input.history.isStub ? '(sin historia previa de la marca — primer contacto)' : JSON.stringify(input.history)}

Devolvé el JSON con el concepto creativo central.`;
}

function validateConcept(data: unknown): asserts data is CreativeConcept {
  if (!data || typeof data !== 'object') throw new Error('Creative Director: respuesta no es un objeto.');
  const d = data as Record<string, unknown>;
  if (typeof d.conceptoCentral !== 'string' || typeof d.directionJustification !== 'string') {
    throw new Error('Creative Director: conceptoCentral o directionJustification inválidos.');
  }
  const paleta = d.paleta as Record<string, unknown> | undefined;
  if (!paleta || typeof paleta.base !== 'string' || typeof paleta.evolution !== 'string' || typeof paleta.accent !== 'string') {
    throw new Error('Creative Director: paleta inválida.');
  }
  if (!Array.isArray(d.moodKeywords) || !d.moodKeywords.every((s) => typeof s === 'string')) {
    throw new Error('Creative Director: moodKeywords debe ser string[].');
  }
  const jer = d.jerarquiaVisual as Record<string, unknown> | undefined;
  if (!jer || typeof jer.headline !== 'string' || typeof jer.subhead !== 'string' || typeof jer.cta !== 'string') {
    throw new Error('Creative Director: jerarquiaVisual inválida.');
  }
}
