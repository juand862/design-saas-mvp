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
import type { BrandDNA } from '@/lib/agents/types';
import type { CampaignFormData } from '@/lib/types';

const SYSTEM_PROMPT = `Eres el Brand Analyzer de Canvas SaaS.

Tu trabajo: tomar los inputs de identidad de marca que un diseñador eligió en un formulario (colores, tipografías, estilos visuales) más referencias visuales sueltas (URLs y keywords) y consolidarlos en un Brand DNA que sirva como input para los agentes creativos siguientes.

Reglas estrictas:
1. Devuelve SOLO un objeto JSON válido. Nada de texto antes o después. Sin markdown fences.
2. Los colores y tipografías que el usuario eligió son DECISIONES, no sugerencias. Preservalos exactamente.
3. \`visualStyle\` es un array de adjetivos visuales accionables. Tomá los del usuario y expandilos con descriptores que sirvan para prompts de imagen (ej. "minimal" → ["minimal", "negative-space-heavy", "high-contrast"]). 4-7 elementos total. No inventes estilos que contradigan los del usuario.
4. \`toneKeywords\` es nuevo: 4-6 adjetivos que capturan la voz visual y verbal de la marca. Inferilos del cruce entre estilo elegido + referencias keywords. Tono profesional, no genérico ("editorial sobrio" mejor que "moderno").
5. Si el usuario no proveyó referencias, igual devolvé toneKeywords basados en el estilo + colores.

Schema de salida (todos los campos obligatorios):
{
  "colorPalette": {
    "primary": string,    // hex que el usuario eligió, sin tocar
    "secondary": string,
    "accent": string
  },
  "typography": {
    "headline": string,   // nombre de fuente que el usuario eligió, sin tocar
    "body": string
  },
  "visualStyle": string[], // 4-7 descriptores visuales accionables
  "toneKeywords": string[]  // 4-6 adjetivos de voz de marca
}

Tono de tu respuesta: analítico, conciso, en español. Sin emojis. Sin disclaimers.`;

export async function analyzeBrand(input: {
  brand: CampaignFormData['brand'];
  references: CampaignFormData['references'];
}): Promise<{
  dna: BrandDNA;
  usage: { inputTokens: number; outputTokens: number; cacheReadInputTokens: number };
}> {
  const userMessage = formatUserInput(input);

  const result = await runAgent<BrandDNA>({
    system: SYSTEM_PROMPT,
    user: userMessage,
    temperature: 0.4,
    maxTokens: 1024,
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
- URLs: ${references.urls.length > 0 ? references.urls.join(', ') : '(ninguna)'}
- Keywords: ${references.keywords.length > 0 ? references.keywords.join(', ') : '(ninguna)'}

Consolidá esto en un Brand DNA según el schema.`;
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
