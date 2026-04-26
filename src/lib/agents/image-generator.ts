// Image Generator — agente 7 del pipeline.
//
// STUB hasta Fase 2B (Replicate con Flux/Ideogram).
// Hoy genera URLs de placeholder usando placehold.co + los colores del
// Brand DNA + el headline del copy correspondiente. Esto deja la UI
// renderizando piezas visuales coherentes con la marca aunque no haya
// generación real.
//
// Cuando llegue Replicate, esta función:
//   1. Por cada FormatImagePrompt llama a Replicate con prompt + negativePrompt
//   2. Sube las imágenes resultantes a Supabase Storage
//   3. Devuelve URLs persistentes con isPlaceholder: false

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

export async function generateImages(input: {
  prompts: ImagePrompts;
  brand: BrandDNA;
  copy: CopyByFormat;
}): Promise<GeneratedImages> {
  const images = input.prompts.prompts.map((p) => {
    const meta = QUICK_CAMPAIGN_FORMATS.find((f) => f.id === p.format);
    const width = meta?.width ?? 1080;
    const height = meta?.height ?? 1080;
    const piece = input.copy.pieces.find((c) => c.format === p.format);
    const url = buildPlaceholderUrl({
      width,
      height,
      bg: input.brand.colorPalette.primary,
      fg: input.brand.colorPalette.accent,
      text: piece?.headline ?? '',
      variation: p.variation,
    });
    return {
      format: p.format as QuickCampaignFormat,
      variation: p.variation,
      url,
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
