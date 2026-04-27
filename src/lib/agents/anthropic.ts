// Cliente compartido del Anthropic SDK + helper `runAgent` para los agentes
// del pipeline. Toda invocación a Claude pasa por acá: modelo default
// centralizado, prompt caching del system prompt, parseo robusto de JSON.

import Anthropic from '@anthropic-ai/sdk';

// Modelos disponibles. Sonnet 4.6 como default — buen balance precio/calidad
// para el MVP. Subir a Opus 4.7 puntualmente (ej. Creative Director) cuando
// el output lo justifique.
export const MODELS = {
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-7',
  haiku: 'claude-haiku-4-5-20251001',
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

let cachedClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY no está definida. Agrega la variable a .env.local.',
    );
  }
  cachedClient = new Anthropic({ apiKey });
  return cachedClient;
}

/** Imagen para enviar al modelo en una llamada multimodal. */
export interface AgentImage {
  mimeType: string;
  /** Base64 puro, sin el prefijo `data:...,`. */
  base64: string;
}

interface RunAgentParams {
  /**
   * System prompt. Se envía con `cache_control: ephemeral` para reducir costo
   * en agentes que comparten contexto entre runs.
   */
  system: string;
  /** User message (input concreto del agente, sin reglas/instrucciones). */
  user: string;
  /**
   * Imágenes opcionales para llamadas multimodales (Brand Analyzer recibe
   * fotos del usuario, p. ej.). Se envían como bloques `image` antes del texto.
   */
  images?: AgentImage[];
  /** Override del modelo. Default: Sonnet 4.6. */
  model?: ModelId;
  /** Tope de tokens de respuesta. Default: 2048 (suficiente para JSONs medianos). */
  maxTokens?: number;
  /** Temperatura. Default: 0.7 — creatividad razonable, no determinismo. */
  temperature?: number;
}

interface RunAgentResult<T> {
  data: T;
  rawText: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheReadInputTokens: number;
    cacheCreationInputTokens: number;
  };
  model: string;
}

/**
 * Llama a Claude con un system prompt cacheado y parsea la respuesta como JSON.
 * Si el modelo devuelve el JSON dentro de un fenced code block, lo extrae.
 */
export async function runAgent<T>(
  params: RunAgentParams,
): Promise<RunAgentResult<T>> {
  const {
    system,
    user,
    images,
    model = MODELS.sonnet,
    maxTokens = 2048,
    temperature = 0.7,
  } = params;

  const userContent: Anthropic.ContentBlockParam[] = [];
  if (images && images.length > 0) {
    for (const img of images) {
      userContent.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: normalizeMime(img.mimeType),
          data: img.base64,
        },
      });
    }
  }
  userContent.push({ type: 'text', text: user });

  const client = getClient();
  const response = await client.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: [
      {
        type: 'text',
        text: system,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userContent }],
  });

  const rawText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  const data = parseJsonFromModelOutput<T>(rawText);

  return {
    data,
    rawText,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheReadInputTokens: response.usage.cache_read_input_tokens ?? 0,
      cacheCreationInputTokens: response.usage.cache_creation_input_tokens ?? 0,
    },
    model: response.model,
  };
}

/**
 * Extrae el primer JSON parseable del output del modelo. Acepta:
 * - JSON crudo
 * - JSON dentro de ```json ... ``` o ``` ... ```
 * - JSON precedido/seguido de texto explicativo
 */
function parseJsonFromModelOutput<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = fenced ? fenced[1] : extractFirstJsonObject(text);
  if (!candidate) {
    throw new Error(`Respuesta del modelo no contiene JSON: ${text.slice(0, 200)}`);
  }
  try {
    return JSON.parse(candidate) as T;
  } catch (err) {
    throw new Error(
      `JSON inválido en respuesta del modelo: ${(err as Error).message}\n` +
        `Candidato: ${candidate.slice(0, 200)}`,
    );
  }
}

/** Normaliza el mime type al subset que Anthropic acepta para imágenes. */
function normalizeMime(mime: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
  const lower = mime.toLowerCase();
  if (lower === 'image/jpeg' || lower === 'image/jpg') return 'image/jpeg';
  if (lower === 'image/png') return 'image/png';
  if (lower === 'image/gif') return 'image/gif';
  if (lower === 'image/webp') return 'image/webp';
  // Fallback: assume jpeg. Anthropic rechaza si está mal.
  return 'image/jpeg';
}

function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}
