'use client';

import { useRef } from 'react';
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

      <GuidelinesUpload
        markdown={value.guidelinesMarkdown}
        fileName={value.guidelinesFileName}
        onChange={(text, name) =>
          onChange({
            ...value,
            guidelinesMarkdown: text,
            guidelinesFileName: name,
          })
        }
      />
    </div>
  );
}

function GuidelinesUpload({
  markdown,
  fileName,
  onChange,
}: {
  markdown: string | undefined;
  fileName: string | undefined;
  onChange: (text: string | undefined, name: string | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasFile = Boolean(markdown && fileName);

  const onFile = async (file: File) => {
    const text = await file.text();
    onChange(text, file.name);
  };

  const onClear = () => {
    onChange(undefined, undefined);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <Field
      label="Brand guidelines (.md)"
      hint="Opcional. Adjuntá un markdown con guidelines de marca. El Brand Analyzer lo prioriza sobre los inputs sueltos cuando hay conflicto."
    >
      <div className="flex flex-col gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".md,text/markdown,text/plain"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFile(file);
          }}
          className="block w-full cursor-pointer border border-white/[0.12] bg-transparent py-3 px-4 text-xs text-white/70 file:mr-4 file:cursor-pointer file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-[0.2em] file:text-white hover:border-white/30"
        />
        {hasFile ? (
          <div className="flex items-center justify-between gap-3 border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs">
            <span className="text-emerald-200/80">
              {fileName} · {markdown?.length.toLocaleString()} caracteres
            </span>
            <button
              type="button"
              onClick={onClear}
              className="text-emerald-200/60 hover:text-emerald-200/90"
            >
              Quitar
            </button>
          </div>
        ) : null}
      </div>
    </Field>
  );
}