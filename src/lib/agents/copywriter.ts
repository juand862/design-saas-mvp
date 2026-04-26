// Copywriter — agente 5 del pipeline.
//
// Input: BriefAnalysis + BrandDNA + CreativeConcept + lista de formatos.
// Output: CopyByFormat — un set de copy (headline, subhead, body, cta) por
// cada formato seleccionado. El copy respeta el conceptoCentral y la
// jerarquía visual definida por el Creative Director.

import { runAgent } from '@/lib/agents/anthropic';
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

const SYSTEM_PROMPT = `Eres el Copywriter de Canvas SaaS.

Tu trabajo: escribir el copy específico de cada formato de una campaña multicanal, respetando un concepto creativo único y un Brand DNA dado.

Reglas estrictas:
1. Devuelve SOLO un objeto JSON válido con la forma { "pieces": [...] }. Sin texto extra, sin markdown fences.
2. Hay UN copy por formato. No dupliques formatos en el array.
3. \`headline\` es la frase principal. Punzante. Menos es más.
   - Instagram Feed: máx 8 palabras
   - Instagram Story: máx 6 palabras (lectura vertical, rápida)
   - Facebook Post: máx 10 palabras
   - LinkedIn Post: máx 12 palabras (audiencia profesional, tolera más)
4. \`subhead\` complementa el headline. Una frase corta. Puede omitirse en formatos muy chicos (devolvé string vacío "" si decidís omitir).
5. \`body\` es texto de apoyo, máx 2 frases. En Instagram Story puede ser "" porque no hay espacio.
6. \`cta\` es action verb + benefit. Máx 6 palabras. Coherente con el CTA del brief refinado pero adaptado al formato (ej. "Comprá ya" en IG Story, "Conocé más sobre las ofertas" en LinkedIn).
7. NUNCA repitas literal el mismo copy entre formatos. Cada formato tiene su voz dentro del concepto único.
8. NO uses palabras vacías ("descubrí", "increíble", "único", "innovador") salvo que aporten valor real.

Schema de salida:
{
  "pieces": [
    {
      "format": string,    // id exacto del formato (ej. "instagram-square")
      "headline": string,
      "subhead": string,
      "body": string,
      "cta": string
    }
  ]
}

Tono: copywriter senior, sin clichés, en español. Match con el tono que pidió el brief.`;

export async function writeCopy(input: {
  brief: BriefAnalysis;
  brand: BrandDNA;
  concept: CreativeConcept;
  formats: QuickCampaignFormat[];
}): Promise<{
  copy: CopyByFormat;
  usage: { inputTokens: number; outputTokens: number; cacheReadInputTokens: number };
}> {
  const userMessage = formatUserInput(input);
  const result = await runAgent<CopyByFormat>({
    system: SYSTEM_PROMPT,
    user: userMessage,
    temperature: 0.7,
    maxTokens: 1500,
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
