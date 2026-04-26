// Art Director — agente 6 del pipeline.
//
// Input: BriefAnalysis + BrandDNA + CreativeConcept + CopyByFormat +
// formats + variationsPerFormat.
// Output: ImagePrompts — un prompt por (formato × variación) listo para
// pasar al modelo de generación de imágenes (Flux/Ideogram en Fase 2B).
//
// Cada variación dentro del mismo formato es un ÁNGULO DISTINTO del mismo
// concepto, no la misma imagen repetida. Eso es lo que vamos a comparar
// cuando lleguen las imágenes reales.

import { runAgent } from '@/lib/agents/anthropic';
import type {
  BrandDNA,
  BriefAnalysis,
  CopyByFormat,
  CreativeConcept,
  ImagePrompts,
} from '@/lib/agents/types';
import {
  QUICK_CAMPAIGN_FORMATS,
  type QuickCampaignFormat,
} from '@/lib/types';

const SYSTEM_PROMPT = `Eres el Art Director de Canvas SaaS.

Tu trabajo: generar prompts técnicos para un modelo de imagen (Flux/Ideogram) que produzcan piezas visuales por formato y variación, alineadas al concepto creativo y al Brand DNA.

Reglas estrictas:
1. Devuelve SOLO un objeto JSON válido con la forma { "prompts": [...] }. Sin texto extra, sin markdown fences.
2. Por cada (formato, variación) generás UN prompt. Si pidieron 2 formatos × 3 variaciones, devolvés 6 entradas.
3. Cada \`prompt\` es una descripción visual densa, en INGLÉS técnico (los modelos rinden mejor así). Incluí: tipo de imagen, sujeto principal, composición, iluminación, paleta (con hex), estilo visual, mood, tipografía si aplica, aspect ratio implícito por formato.
4. Cada variación del mismo formato es un ÁNGULO DISTINTO del concepto: cambiá ángulo de cámara, sujeto secundario, color dominante dentro de la paleta, o tratamiento (foto realista vs. ilustración vs. collage). NUNCA dos variaciones idénticas.
5. \`negativePrompt\` lista cosas a evitar — coherente con el brief y la marca (ej. "stock photography clichés, watermarks, low contrast, busy backgrounds, generic happy people").
6. NO inventes texto que aparezca dentro de la imagen — eso lo controla el Layout Composer (agente 8). Mencioná dónde va a ir el texto ("space reserved at top-right for headline overlay") pero no escribas el headline.

Schema de salida:
{
  "prompts": [
    {
      "format": string,           // id del formato
      "variation": number,        // 1, 2, 3, ...
      "prompt": string,           // EN INGLÉS, denso, accionable
      "negativePrompt": string    // EN INGLÉS
    }
  ]
}

Tono: art director técnico. Sin emojis.`;

export async function directArt(input: {
  brief: BriefAnalysis;
  brand: BrandDNA;
  concept: CreativeConcept;
  copy: CopyByFormat;
  formats: QuickCampaignFormat[];
  variationsPerFormat: number;
}): Promise<{
  prompts: ImagePrompts;
  usage: { inputTokens: number; outputTokens: number; cacheReadInputTokens: number };
}> {
  const userMessage = formatUserInput(input);
  const result = await runAgent<ImagePrompts>({
    system: SYSTEM_PROMPT,
    user: userMessage,
    temperature: 0.8,
    maxTokens: 2048,
  });
  validatePrompts(result.data, input.formats, input.variationsPerFormat);
  return {
    prompts: result.data,
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
  copy: CopyByFormat;
  formats: QuickCampaignFormat[];
  variationsPerFormat: number;
}): string {
  const formatLines = input.formats
    .map((id) => {
      const meta = QUICK_CAMPAIGN_FORMATS.find((f) => f.id === id);
      const piece = input.copy.pieces.find((c) => c.format === id);
      return `- ${id} (${meta?.label}, ${meta?.width}×${meta?.height}) — headline: "${piece?.headline ?? '(sin copy)'}"`;
    })
    .join('\n');

  return `Brief:
- Audiencia: ${input.brief.audiencia}
- Tono: ${input.brief.tono}
- Ocasión: ${input.brief.ocasion}

Brand DNA:
- Paleta: primary ${input.brand.colorPalette.primary}, secondary ${input.brand.colorPalette.secondary}, accent ${input.brand.colorPalette.accent}
- Estilo visual: ${input.brand.visualStyle.join(', ')}

Concepto creativo:
- Central: ${input.concept.conceptoCentral}
- Mood: ${input.concept.moodKeywords.join(', ')}
- Paleta evolucionada: base ${input.concept.paleta.base}, evolution ${input.concept.paleta.evolution}, accent ${input.concept.paleta.accent}

Formatos y headlines:
${formatLines}

Variaciones por formato: ${input.variationsPerFormat}

Devolvé el JSON con ${input.formats.length * input.variationsPerFormat} prompts (uno por cada formato × variación).`;
}

function validatePrompts(
  data: unknown,
  expectedFormats: QuickCampaignFormat[],
  variationsPerFormat: number,
): asserts data is ImagePrompts {
  if (!data || typeof data !== 'object') throw new Error('Art Director: respuesta no es un objeto.');
  const d = data as Record<string, unknown>;
  if (!Array.isArray(d.prompts)) throw new Error('Art Director: prompts debe ser array.');

  const expectedCount = expectedFormats.length * variationsPerFormat;
  if (d.prompts.length !== expectedCount) {
    throw new Error(`Art Director: se esperaban ${expectedCount} prompts, se recibieron ${d.prompts.length}.`);
  }
  for (const p of d.prompts) {
    if (!p || typeof p !== 'object') throw new Error('Art Director: prompt inválido.');
    const pr = p as Record<string, unknown>;
    if (typeof pr.format !== 'string' || !expectedFormats.includes(pr.format as QuickCampaignFormat)) {
      throw new Error(`Art Director: formato "${pr.format}" inválido.`);
    }
    if (typeof pr.variation !== 'number' || pr.variation < 1 || pr.variation > variationsPerFormat) {
      throw new Error(`Art Director: variation "${pr.variation}" fuera de rango (1..${variationsPerFormat}).`);
    }
    if (typeof pr.prompt !== 'string' || typeof pr.negativePrompt !== 'string') {
      throw new Error('Art Director: prompt/negativePrompt deben ser string.');
    }
  }
}
