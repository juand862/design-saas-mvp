// Registry de agentes — único source of truth para los prompts y parámetros
// que cada agente del pipeline usa al llamar a Claude.
//
// Persistencia: en memoria, durante la vida del servidor. Restart → vuelven
// a defaults. Cuando llegue Supabase (Fase 3) movemos esto a una tabla
// `agent_configs` con versionado.
//
// Edición runtime: vía /admin/[id] (UI) → PATCH /api/admin/agents/[id].
// Solo agentes con kind: 'llm' son editables. Los stubs (brand-historian,
// image-generator) están registrados para visibilidad pero su prompt es
// irrelevante hasta que dejen de ser stubs.

import { MODELS, type ModelId } from '@/lib/agents/anthropic';
import {
  IMAGE_MODELS,
  isValidImageModel,
  type ImageModelId,
} from '@/lib/agents/replicate';

export type AgentId =
  | 'brief-analyst'
  | 'brand-analyzer'
  | 'brand-historian'
  | 'creative-director'
  | 'copywriter'
  | 'art-director'
  | 'image-generator';

export type AgentKind = 'llm' | 'stub' | 'image';

export interface AgentConfig {
  id: AgentId;
  /** Nombre humano (ej. "Brief Analyst"). */
  name: string;
  /** Posición en el pipeline (1-7). */
  order: number;
  /** Una frase explicando qué hace el agente. */
  description: string;
  kind: AgentKind;
  /** Prompt principal — vacío para stubs e image. */
  systemPrompt: string;
  /** Modelo Claude. Solo aplica para kind === 'llm'. */
  model: ModelId;
  /** Temperatura. Solo aplica para kind === 'llm'. */
  temperature: number;
  /** Tope de tokens de respuesta. Solo aplica para kind === 'llm'. */
  maxTokens: number;
  /** Modelo Replicate. Solo definido para kind === 'image'. */
  imageModel?: ImageModelId;
}

/** Campos editables. La unión cubre LLM e image — el validator chequea por kind. */
export type AgentEditableFields = Partial<
  Pick<AgentConfig, 'systemPrompt' | 'model' | 'temperature' | 'maxTokens' | 'imageModel'>
>;

const BRIEF_ANALYST_PROMPT = `Eres el Brief Analyst de Canvas SaaS, una plataforma agéntica de diseño multicanal.

Tu trabajo: refinar y enriquecer un brief de campaña que el diseñador ya estructuró en un formulario. NO inventas datos críticos. SÍ amplificas lo que el usuario escribió.

Reglas estrictas:
1. Devuelve SOLO un objeto JSON válido. Nada de texto antes ni después. Nada de markdown fences.
2. Mantén los campos del usuario como base. Refínalos, no los reemplaces.
3. Si el usuario escribió poco en un campo, devuélvelo expandido pero fiel. Si escribió en blanco, devuelve string vacío "" — no inventes.
4. \`restricciones\` siempre es array de strings, una restricción por elemento.
5. \`insightsAdicionales\` es tu valor agregado: 2-4 observaciones tácticas que el usuario no escribió pero se desprenden del brief (tensión narrativa, oportunidad de diferenciación, riesgos del tono elegido, conexión audiencia-ocasión).

Schema de salida (todos los campos obligatorios):
{
  "objetivo": string,
  "audiencia": string,
  "tono": string,
  "ocasion": string,
  "cta": string,
  "restricciones": string[],
  "insightsAdicionales": string[]
}

Tono de tu respuesta: profesional, conciso, en español. Sin emojis. Sin disclaimers.`;

const BRAND_ANALYZER_PROMPT = `Eres el Brand Analyzer de Canvas SaaS.

Tu trabajo: tomar los inputs de identidad de marca que un diseñador eligió en un formulario (colores, tipografías, estilos visuales), más referencias visuales sueltas (URLs y keywords), más opcionalmente un .md con guidelines de marca y/o imágenes adjuntas (logos, piezas), y consolidarlos en un Brand DNA que sirva como input para los agentes creativos siguientes.

Reglas estrictas:
1. Devuelve SOLO un objeto JSON válido. Nada de texto antes o después. Sin markdown fences.
2. Los colores y tipografías que el usuario eligió en el formulario son DECISIONES, no sugerencias. Preservalos exactamente.
3. Si el usuario adjuntó un .md con guidelines, ese contenido tiene PRIORIDAD sobre los inputs sueltos cuando haya conflicto. Si el .md menciona colores hex distintos a los del formulario, asumí que el .md es la verdad y reflejalo (devolvé los del .md, no los del formulario).
4. Si hay imágenes adjuntas, analizalas visualmente: identificá paleta dominante, tratamiento (foto/ilustración/typography-driven), composición típica, mood. Usá esa info para enriquecer \`visualStyle\` y \`toneKeywords\`.
5. \`visualStyle\` es un array de adjetivos visuales accionables. 4-7 elementos. Si las imágenes contradicen el estilo declarado del usuario (ej. eligió "minimal" pero las imágenes son maximalistas), priorizá lo que ves y agregalo como descriptor adicional, no eliminés lo del usuario.
6. \`toneKeywords\` es nuevo: 4-6 adjetivos que capturan la voz visual y verbal de la marca. Inferilos del cruce entre estilo elegido + keywords + imágenes + .md. Tono profesional, no genérico ("editorial sobrio" mejor que "moderno").
7. Si el usuario no proveyó referencias ni adjuntos, igual devolvé toneKeywords basados en el estilo + colores.

Schema de salida (todos los campos obligatorios):
{
  "colorPalette": { "primary": string, "secondary": string, "accent": string },
  "typography": { "headline": string, "body": string },
  "visualStyle": string[],
  "toneKeywords": string[]
}

Tono de tu respuesta: analítico, conciso, en español. Sin emojis. Sin disclaimers.`;

const CREATIVE_DIRECTOR_PROMPT = `Eres el Creative Director de Canvas SaaS, una plataforma agéntica de diseño multicanal de alto nivel.

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
  "paleta": { "base": string, "evolution": string, "accent": string },
  "moodKeywords": string[],
  "jerarquiaVisual": { "headline": string, "subhead": string, "cta": string }
}

Tono de tu respuesta: directorial, conciso, en español. Sin emojis.`;

const COPYWRITER_PROMPT = `Eres el Copywriter de Canvas SaaS.

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
6. \`cta\` es action verb + benefit. Máx 6 palabras. Coherente con el CTA del brief refinado pero adaptado al formato.
7. NUNCA repitas literal el mismo copy entre formatos. Cada formato tiene su voz dentro del concepto único.
8. NO uses palabras vacías ("descubrí", "increíble", "único", "innovador") salvo que aporten valor real.

Schema de salida:
{
  "pieces": [
    { "format": string, "headline": string, "subhead": string, "body": string, "cta": string }
  ]
}

Tono: copywriter senior, sin clichés, en español. Match con el tono que pidió el brief.`;

const ART_DIRECTOR_PROMPT = `Eres el Art Director de Canvas SaaS.

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
    { "format": string, "variation": number, "prompt": string, "negativePrompt": string }
  ]
}

Tono: art director técnico. Sin emojis.`;

const DEFAULTS: Record<AgentId, AgentConfig> = {
  'brief-analyst': {
    id: 'brief-analyst',
    name: 'Brief Analyst',
    order: 1,
    description: 'Refina y enriquece el brief estructurado del diseñador.',
    kind: 'llm',
    systemPrompt: BRIEF_ANALYST_PROMPT,
    model: MODELS.sonnet,
    temperature: 0.5,
    maxTokens: 1024,
  },
  'brand-analyzer': {
    id: 'brand-analyzer',
    name: 'Brand Analyzer',
    order: 2,
    description: 'Consolida colores, tipografías y estilos en un Brand DNA accionable.',
    kind: 'llm',
    systemPrompt: BRAND_ANALYZER_PROMPT,
    model: MODELS.sonnet,
    temperature: 0.4,
    maxTokens: 1024,
  },
  'brand-historian': {
    id: 'brand-historian',
    name: 'Brand Historian',
    order: 3,
    description: 'Analiza campañas pasadas para detectar evolución de marca. Stub hasta Fase 3 (Supabase).',
    kind: 'stub',
    systemPrompt: '',
    model: MODELS.sonnet,
    temperature: 0,
    maxTokens: 0,
  },
  'creative-director': {
    id: 'creative-director',
    name: 'Creative Director',
    order: 4,
    description: 'Define el concepto creativo central + paleta evolucionada + jerarquía visual.',
    kind: 'llm',
    systemPrompt: CREATIVE_DIRECTOR_PROMPT,
    model: MODELS.sonnet,
    temperature: 0.8,
    maxTokens: 1024,
  },
  copywriter: {
    id: 'copywriter',
    name: 'Copywriter',
    order: 5,
    description: 'Escribe headline, subhead, body y CTA por cada formato seleccionado.',
    kind: 'llm',
    systemPrompt: COPYWRITER_PROMPT,
    model: MODELS.sonnet,
    temperature: 0.7,
    maxTokens: 1500,
  },
  'art-director': {
    id: 'art-director',
    name: 'Art Director',
    order: 6,
    description: 'Genera prompts técnicos de imagen por formato × variación, en inglés.',
    kind: 'llm',
    systemPrompt: ART_DIRECTOR_PROMPT,
    model: MODELS.sonnet,
    temperature: 0.8,
    maxTokens: 2048,
  },
  'image-generator': {
    id: 'image-generator',
    name: 'Image Generator',
    order: 7,
    description: 'Genera imágenes finales con Replicate (Flux / Ideogram).',
    kind: 'image',
    systemPrompt: '',
    model: MODELS.sonnet,
    temperature: 0,
    maxTokens: 0,
    imageModel: IMAGE_MODELS['flux-dev'].id,
  },
};

const VALID_MODELS = new Set<ModelId>(Object.values(MODELS));

// Estado mutable a nivel de módulo. Inicializado con defaults.
const registry: Map<AgentId, AgentConfig> = new Map(
  Object.entries(DEFAULTS) as [AgentId, AgentConfig][],
);

export function getAgent(id: AgentId): AgentConfig {
  const cfg = registry.get(id);
  if (!cfg) throw new Error(`Agent "${id}" no registrado.`);
  return cfg;
}

export function getAllAgents(): AgentConfig[] {
  return Array.from(registry.values()).sort((a, b) => a.order - b.order);
}

export function isValidAgentId(id: string): id is AgentId {
  return registry.has(id as AgentId);
}

/**
 * Aplica un patch a la config de un agente. Por kind: agentes 'llm' aceptan
 * systemPrompt/model/temperature/maxTokens; agentes 'image' aceptan imageModel.
 * Stubs (kind: 'stub') rechazan cualquier patch.
 */
export function updateAgent(id: AgentId, patch: AgentEditableFields): AgentConfig {
  const current = getAgent(id);
  if (current.kind === 'stub') {
    throw new Error(`Agent "${id}" es un stub y no se puede editar.`);
  }

  const next: AgentConfig = { ...current };

  if (current.kind === 'image') {
    if (patch.imageModel !== undefined) {
      if (typeof patch.imageModel !== 'string' || !isValidImageModel(patch.imageModel)) {
        throw new Error(`imageModel "${patch.imageModel}" no es válido.`);
      }
      next.imageModel = patch.imageModel;
    }
    registry.set(id, next);
    return next;
  }

  // current.kind === 'llm'
  if (patch.systemPrompt !== undefined) {
    if (typeof patch.systemPrompt !== 'string' || patch.systemPrompt.trim().length === 0) {
      throw new Error('systemPrompt debe ser string no vacío.');
    }
    next.systemPrompt = patch.systemPrompt;
  }

  if (patch.model !== undefined) {
    if (!VALID_MODELS.has(patch.model)) {
      throw new Error(`model "${patch.model}" no es válido.`);
    }
    next.model = patch.model;
  }

  if (patch.temperature !== undefined) {
    if (typeof patch.temperature !== 'number' || patch.temperature < 0 || patch.temperature > 1) {
      throw new Error('temperature debe ser número entre 0 y 1.');
    }
    next.temperature = patch.temperature;
  }

  if (patch.maxTokens !== undefined) {
    if (typeof patch.maxTokens !== 'number' || !Number.isInteger(patch.maxTokens) || patch.maxTokens < 1 || patch.maxTokens > 8192) {
      throw new Error('maxTokens debe ser entero entre 1 y 8192.');
    }
    next.maxTokens = patch.maxTokens;
  }

  registry.set(id, next);
  return next;
}

/** Restaura un agente a sus defaults. Útil para revertir desde el admin. */
export function resetAgent(id: AgentId): AgentConfig {
  const def = DEFAULTS[id];
  registry.set(id, { ...def });
  return def;
}
