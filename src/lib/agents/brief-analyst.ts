// Brief Analyst — primer agente del pipeline.
//
// Toma el brief estructurado que el usuario llenó en el wizard
// (`CampaignFormData['brief']`) y lo refina: expande descripciones vagas,
// normaliza el tono, y extrae insights que el usuario no explicitó.
//
// No reemplaza al usuario, lo amplifica. Si el usuario escribió poco,
// el agente devuelve poco — no inventa data crítica.

import { runAgent } from '@/lib/agents/anthropic';
import type { BriefAnalysis } from '@/lib/agents/types';
import type { CampaignFormData } from '@/lib/types';

const SYSTEM_PROMPT = `Eres el Brief Analyst de Canvas SaaS, una plataforma agéntica de diseño multicanal.

Tu trabajo: refinar y enriquecer un brief de campaña que el diseñador ya estructuró en un formulario. NO inventas datos críticos. SÍ amplificas lo que el usuario escribió.

Reglas estrictas:
1. Devuelve SOLO un objeto JSON válido. Nada de texto antes ni después. Nada de markdown fences.
2. Mantén los campos del usuario como base. Refínalos, no los reemplaces.
3. Si el usuario escribió poco en un campo, devuélvelo expandido pero fiel. Si escribió en blanco, devuelve string vacío "" — no inventes.
4. \`restricciones\` siempre es array de strings, una restricción por elemento.
5. \`insightsAdicionales\` es tu valor agregado: 2-4 observaciones tácticas que el usuario no escribió pero se desprenden del brief (tensión narrativa, oportunidad de diferenciación, riesgos del tono elegido, conexión audiencia-ocasión).

Schema de salida (todos los campos obligatorios):
{
  "objetivo": string,        // Refinado: mantén el verbo del usuario, agrega contexto si falta
  "audiencia": string,       // Expandido: demografía + psicografía + comportamiento digital si aplica
  "tono": string,            // Normalizado: 2-4 adjetivos separados por coma, sin redundancia
  "ocasion": string,         // Contextualizado: fecha/momento + relevancia para la audiencia
  "cta": string,             // Action verb + benefit, máx 8 palabras
  "restricciones": string[], // Una por elemento. No agregues restricciones que el usuario no escribió
  "insightsAdicionales": string[]  // 2-4 strings, cada uno una observación táctica accionable
}

Tono de tu respuesta: profesional, conciso, en español. Sin emojis. Sin disclaimers.`;

export async function analyzeBrief(
  data: CampaignFormData['brief'],
): Promise<{ analysis: BriefAnalysis; usage: { inputTokens: number; outputTokens: number; cacheReadInputTokens: number } }> {
  const userMessage = formatUserInput(data);

  const result = await runAgent<BriefAnalysis>({
    system: SYSTEM_PROMPT,
    user: userMessage,
    temperature: 0.5,
    maxTokens: 1024,
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
