// Image Generator — agente 7 del pipeline.
//
// Llama a Replicate (modelo configurable desde /admin/[image-generator])
// con cada FormatImagePrompt en paralelo. Devuelve URLs públicas que
// Replicate hostea (expiran a la hora — para MVP es suficiente; persistencia
// en Supabase llega en Fase 3).
//
// Si Replicate falla para una imagen específica, el resto sigue. La imagen
// fallida vuelve como placeholder con el error en el url (texto). El cliente
// puede reintentar.

import {
  QUICK_CAMPAIGN_FORMATS,
  type QuickCampaignFormat,
} from '@/lib/types';
import type {
  BrandDNA,
  CopyByFormat,
  GeneratedImages,
  ImagePrompts,
} from '@/lib/agents/types';
import { getAgent } from '@/lib/agents/registry';
import { generateOne, type AspectRatio } from '@/lib/agents/replicate';

const FORMAT_TO_ASPECT: Record<QuickCampaignFormat, AspectRatio> = {
  'instagram-square': '1:1',
  'instagram-story': '9:16',
  'facebook-post': '16:9',
  'linkedin-post': '16:9',
};

export async function generateImages(input: {
  prompts: ImagePrompts;
  brand: BrandDNA;
  copy: CopyByFormat;
}): Promise<GeneratedImages> {
  const cfg = getAgent('image-generator');
  if (!cfg.imageModel) {
    throw new Error('Image Generator: imageModel no configurado en el registry.');
  }
  const modelId = cfg.imageModel;

  // En paralelo: cada prompt es independiente.
  const settled = await Promise.allSettled(
    input.prompts.prompts.map(async (p) => {
      const meta = QUICK_CAMPAIGN_FORMATS.find((f) => f.id === p.format);
      const width = meta?.width ?? 1080;
      const height = meta?.height ?? 1080;
      const aspectRatio = FORMAT_TO_ASPECT[p.format] ?? '1:1';

      const url = await generateOne({
        modelId,
        prompt: p.prompt,
        negativePrompt: p.negativePrompt || undefined,
        aspectRatio,
      });

      return {
        format: p.format,
        variation: p.variation,
        url,
        width,
        height,
        isPlaceholder: false,
      };
    }),
  );

  const images = settled.map((r, idx) => {
    const p = input.prompts.prompts[idx];
    const meta = QUICK_CAMPAIGN_FORMATS.find((f) => f.id === p.format);
    const width = meta?.width ?? 1080;
    const height = meta?.height ?? 1080;
    if (r.status === 'fulfilled') return r.value;
    // Fallback: placeholder con el error embebido en el texto.
    const piece = input.copy.pieces.find((c) => c.format === p.format);
    const errorText = r.reason instanceof Error ? r.reason.message : 'Error desconocido';
    const fallback = buildPlaceholderUrl({
      width,
      height,
      bg: input.brand.colorPalette.primary,
      fg: input.brand.colorPalette.accent,
      text: `${piece?.headline ?? ''} (fallo: ${errorText.slice(0, 40)})`,
      variation: p.variation,
    });
    console.error(`[image-generator] fallo en ${p.format} v${p.variation}:`, r.reason);
    return {
      format: p.format,
      variation: p.variation,
      url: fallback,
      width,
      height,
      isPlaceholder: true,
    };
  });

  return { images };
}

function buildPlaceholderUrl(args: {
  width: number;
  height: number;
  bg: string;
  fg: string;
  text: string;
  variation: number;
}): string {
  const bgHex = args.bg.replace('#', '');
  const fgHex = args.fg.replace('#', '');
  const label = `${args.text || 'Canvas'} · v${args.variation}`;
  const encoded = encodeURIComponent(label.slice(0, 80));
  return `https://placehold.co/${args.width}x${args.height}/${bgHex}/${fgHex}.png?text=${encoded}&font=montserrat`;
}
