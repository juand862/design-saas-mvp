// Brief Analyst — primer agente del pipeline.
//
// Toma el brief estructurado que el usuario llenó en el wizard
// (`CampaignFormData['brief']`) y lo refina: expande descripciones vagas,
// normaliza el tono, y extrae insights que el usuario no explicitó.
//
// No reemplaza al usuario, lo amplifica. Si el usuario escribió poco,
// el agente devuelve poco — no inventa data crítica.

import { runAgent } from '@/lib/agents/anthropic';
import { getAgent } from '@/lib/agents/registry';
import type { BriefAnalysis } from '@/lib/agents/types';
import type { CampaignFormData } from '@/lib/types';

export async function analyzeBrief(
  data: CampaignFormData['brief'],
): Promise<{ analysis: BriefAnalysis; usage: { inputTokens: number; outputTokens: number; cacheReadInputTokens: number } }> {
  const cfg = getAgent('brief-analyst');
  const userMessage = formatUserInput(data);

  const result = await runAgent<BriefAnalysis>({
    system: cfg.systemPrompt,
    user: userMessage,
    model: cfg.model,
    temperature: cfg.temperature,
    maxTokens: cfg.maxTokens,
  });

  validateBriefAnalysis(result.data);

  return {
    analysis: result.data,
    usage: {
      inputTokens: result.usage.inputTokens,
      outputTokens: result.usage.outputTokens,
      cacheReadInputTokens: result.usage.cacheReadInputTokens,
    },
  };
}

function formatUserInput(brief: CampaignFormData['brief']): string {
  return `Brief estructurado del diseñador:

Tipo de campaña: ${brief.campaignType}
Objetivo: ${brief.objetivo || '(vacío)'}
Audiencia: ${brief.audiencia || '(vacío)'}
Tono buscado: ${brief.tono || '(vacío)'}
Ocasión: ${brief.ocasion || '(vacío)'}
Call to action: ${brief.cta || '(vacío)'}
Restricciones explícitas:
${brief.restricciones.length > 0 ? brief.restricciones.map((r) => `- ${r}`).join('\n') : '(ninguna)'}

Refina y devuelve el JSON según el schema.`;
}

function validateBriefAnalysis(data: unknown): asserts data is BriefAnalysis {
  if (!data || typeof data !== 'object') {
    throw new Error('Brief Analyst: respuesta no es un objeto.');
  }
  const d = data as Record<string, unknown>;
  const requiredStringFields = ['objetivo', 'audiencia', 'tono', 'ocasion', 'cta'];
  for (const field of requiredStringFields) {
    if (typeof d[field] !== 'string') {
      throw new Error(`Brief Analyst: campo "${field}" inválido o ausente.`);
    }
  }
  if (!Array.isArray(d.restricciones) || !d.restricciones.every((r) => typeof r === 'string')) {
    throw new Error('Brief Analyst: "restricciones" debe ser string[].');
  }
  if (!Array.isArray(d.insightsAdicionales) || !d.insightsAdicionales.every((s) => typeof s === 'string')) {
    throw new Error('Brief Analyst: "insightsAdicionales" debe ser string[].');
  }
}
