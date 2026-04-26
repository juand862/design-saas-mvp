'use client';

import {
  CampaignFormData,
  TYPOGRAPHY_OPTIONS,
  VISUAL_STYLE_OPTIONS,
  VisualStyle,
} from '@/lib/types';
import { Field, ChipGroup, ColorField } from './form-primitives';

type BrandData = CampaignFormData['brand'];

export function BrandStep({
  value,
  onChange,
}: {
  value: BrandData;
  onChange: (next: BrandData) => void;
}) {
  return (
    <div className="space-y-12">
      <div>
        <p className="mb-6 text-[10px] uppercase tracking-[0.3em] text-white/30">
          Paleta cromática
        </p>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <ColorField
            label="Primario"
            value={value.colors.primary}
            onChange={(v) =>
              onChange({ ...value, colors: { ...value.colors, primary: v } })
            }
          />
          <ColorField
            label="Secundario"
            value={value.colors.secondary}
            onChange={(v) =>
              onChange({ ...value, colors: { ...value.colors, secondary: v } })
            }
          />
          <ColorField
            label="Acento"
            value={value.colors.accent}
            onChange={(v) =>
              onChange({ ...value, colors: { ...value.colors, accent: v } })
            }
          />
        </div>
      </div>

      <div>
        <p className="mb-6 text-[10px] uppercase tracking-[0.3em] text-white/30">
          Tipografía
        </p>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
          <Field label="Headline">
            <ChipGroup
              options={TYPOGRAPHY_OPTIONS}
              value={value.typography.headline}
              onChange={(v) =>
                onChange({
                  ...value,
                  typography: { ...value.typography, headline: v as string },
                })
              }
            />
          </Field>
          <Field label="Body">
            <ChipGroup
              options={TYPOGRAPHY_OPTIONS}
              value={value.typography.body}
              onChange={(v) =>
                onChange({
                  ...value,
                  typography: { ...value.typography, body: v as string },
                })
              }
            />
          </Field>
        </div>
      </div>

      <Field label="Estilo visual" hint="Multi-selección. Cero o más adjetivos.">
        <ChipGroup<VisualStyle>
          options={VISUAL_STYLE_OPTIONS}
          value={value.style}
          multi
          renderLabel={(id) => id}
          onChange={(v) => onChange({ ...value, style: v as VisualStyle[] })}
        />
      </Field>
    </div>
  );
}