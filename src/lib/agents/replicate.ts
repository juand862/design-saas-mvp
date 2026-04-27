// Cliente compartido para Replicate (generación de imágenes).
//
// El registry de agentes (kind: 'image') referencia uno de los IMAGE_MODELS
// por id. La función generateOne() ejecuta UN prompt y devuelve la URL.
// Image Generator orquesta múltiples llamadas en paralelo.
//
// Token: viene del token registry (admin/tokens), que a su vez se inicializa
// con REPLICATE_API_TOKEN. El cliente se crea fresco cada llamada — el token
// puede cambiarse en runtime desde /admin/tokens.

import Replicate from 'replicate';
import { getReplicateToken } from '@/lib/admin/tokens';

export const IMAGE_MODELS = {
  'flux-dev': {
    id: 'black-forest-labs/flux-dev' as const,
    label: 'Flux Dev (default — calidad/costo equilibrado)',
    supportsNegativePrompt: true,
  },
  'flux-schnell': {
    id: 'black-forest-labs/flux-schnell' as const,
    label: 'Flux Schnell (rápido y barato — ~$0.003/imagen)',
    supportsNegativePrompt: false,
  },
  'flux-pro': {
    id: 'black-forest-labs/flux-1.1-pro' as const,
    label: 'Flux 1.1 Pro (premium — ~$0.04/imagen)',
    supportsNegativePrompt: false,
  },
  'ideogram-v2': {
    id: 'ideogram-ai/ideogram-v2' as const,
    label: 'Ideogram v2 (mejor para texto en imagen — ~$0.08)',
    supportsNegativePrompt: true,
  },
} as const;

export type ImageModelKey = keyof typeof IMAGE_MODELS;
export type ImageModelId = (typeof IMAGE_MODELS)[ImageModelKey]['id'];

export function isValidImageModel(id: string): id is ImageModelId {
  return Object.values(IMAGE_MODELS).some((m) => m.id === id);
}

export function findImageModelByIdentifier(id: string): (typeof IMAGE_MODELS)[ImageModelKey] | undefined {
  return Object.values(IMAGE_MODELS).find((m) => m.id === id);
}

function getClient(): Replicate {
  const token = getReplicateToken();
  if (!token) {
    throw new Error(
      'REPLICATE_API_TOKEN no está definida. Configuralo en .env.local o desde /admin/tokens.',
    );
  }
  return new Replicate({ auth: token });
}

export type AspectRatio = '1:1' | '9:16' | '16:9' | '4:5' | '3:4';

interface GenerateOneArgs {
  modelId: ImageModelId;
  prompt: string;
  negativePrompt?: string;
  aspectRatio: AspectRatio;
}

/** Ejecuta un único prompt en Replicate y devuelve la URL pública del output. */
export async function generateOne(args: GenerateOneArgs): Promise<string> {
  const client = getClient();
  const meta = findImageModelByIdentifier(args.modelId);
  const supportsNeg = meta?.supportsNegativePrompt ?? false;

  const input: Record<string, unknown> = {
    prompt: args.prompt,
    aspect_ratio: args.aspectRatio,
  };
  if (supportsNeg && args.negativePrompt) {
    input.negative_prompt = args.negativePrompt;
  }

  const output = await client.run(args.modelId, { input });
  const url = extractFirstUrl(output);
  if (!url) {
    throw new Error(`Replicate devolvió un output inesperado para ${args.modelId}.`);
  }
  return url;
}

function extractFirstUrl(output: unknown): string | null {
  if (!output) return null;
  if (typeof output === 'string') return output;
  if (Array.isArray(output)) {
    return output.length > 0 ? extractUrlFromItem(output[0]) : null;
  }
  return extractUrlFromItem(output);
}

function extractUrlFromItem(item: unknown): string | null {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') {
    const obj = item as { url?: unknown; toString?: unknown };
    // FileOutput tiene un método url() que devuelve URL.
    if (typeof obj.url === 'function') {
      try {
        const value = (obj.url as () => URL)();
        return value instanceof URL ? value.toString() : String(value);
      } catch {
        // continúa abajo
      }
    }
    if (typeof obj.toString === 'function') {
      const s = String(item);
      if (s.startsWith('http')) return s;
    }
  }
  return null;
}
