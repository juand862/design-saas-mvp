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
import type {
  BrandDNA,
  BrandHistorianInsights,
  BriefAnalysis,
  CreativeConcept,
} from '@/lib/agents/types';

const SYSTEM_PROMPT = `Eres el Creative Director de Canvas SaaS, una plataforma agéntica de diseño multicanal de alto nivel.

Tu trabajo: tomar un brief refinado, un Brand DNA, e (opcionalmente) insights históricos de la marca, y proponer un concepto creativo central que sirva como única fuente de verdad para Copywriter y Art Director.

Reglas estrictas:
1. Devuelve SOLO un objeto JSON válido. Sin texto antes/después. Sin markdown fences.
2. \`conceptoCentral\` es UNA idea. 1 frase. Específica, no genérica. NO uses palabras como "innovador", "único", "moderno".
3. \`directionJustification\` explica POR QUÉ ese concepto resuelve el brief en 2-3 frases. Si hay insights históricos, conectá con ellos. Si \`isStub\` viene true, no inventes historia: justificá basándote solo en brief + brand.
4. \`paleta.base\` y \`paleta.accent\` deben venir de los colores que ya eligió la marca (no inventes hex). \`paleta.evolution\` es UN color nuevo opcional que tensiona la paleta — un hex que dialoga con base+accent. Si la marca es muy minimalista o el concepto no lo pide, repetí el secondary.
5. \`moodKeywords\` 3-5 adjetivos visuales precisos. No genéricos.
6. \`jerarquiaVisual\` describe cómo se trata cada elemento textual en el diseño (ej. "headline: máximo impacto, escala 8x, Bebas Neue uppercase / subhead: contraste 30%, Inter medium / cta: bloque sólido accent, padding generoso").

Schema de salida (todos los campos obligatorios):
{
  "conceptoCentral": string,
  "directionJustification": string,
  "paleta": {
    "base": string,        // hex, viene del Brand DNA primary
    "evolution": string,   // hex nuevo o repetición del secondary
    "accent": string       // hex, viene del Brand DNA accent
  },
  "moodKeywords": string[],
  "jerarquiaVisual": {
    "headline": string,
    "subhead": string,
    "cta": string
  }
}

Tono de tu respuesta: directorial, conciso, en español. Sin emojis.`;

export async function directConcept(input: {
  brief: BriefAnalysis;
  brand: BrandDNA;
  history: BrandHistorianInsights;
}): Promise<{
  concept: CreativeConcept;
  usage: { inputTokens: number; outputTokens: number; cacheReadInputTokens: number };
}> {
  const userMessage = formatUserInput(input);
  const result = await runAgent<CreativeConcept>({
    system: SYSTEM_PROMPT,
    user: userMessage,
    temperature: 0.8,
    maxTokens: 1024,
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
