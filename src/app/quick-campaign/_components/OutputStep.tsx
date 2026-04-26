'use client';

import {
  CampaignFormData,
  QUICK_CAMPAIGN_FORMATS,
  QuickCampaignFormat,
} from '@/lib/types';
import { Field, Chip } from './form-primitives';

type OutputData = CampaignFormData['output'];

export function OutputStep({
  value,
  onChange,
}: {
  value: OutputData;
  onChange: (next: OutputData) => void;
}) {
  const toggleFormat = (id: QuickCampaignFormat) => {
    const next = value.formats.includes(id)
      ? value.formats.filter((f) => f !== id)
      : [...value.formats, id];
    onChange({ ...value, formats: next });
  };

  return (
    <div className="space-y-12">
      <Field
        label="Formatos"
        hint="Selecciona los canales donde se publicará la campaña."
      >
        <div className="grid grid-cols-1 gap-px bg-white/[0.08] sm:grid-cols-2">
          {QUICK_CAMPAIGN_FORMATS.map((fmt) => {
            const isActive = value.formats.includes(fmt.id);
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => toggleFormat(fmt.id)}
                className={`flex items-center justify-between bg-[#0A0A0A] p-6 text-left transition-colors ${
                  isActive ? 'bg-white/[0.04]' : 'hover:bg-white/[0.02]'
                }`}
              >
                <div>
                  <p
                    className={`font-[family-name:var(--font-display)] text-2xl ${
                      isActive ? 'text-white' : 'text-white/50'
                    }`}
                  >
                    {fmt.label}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/30">
                    {fmt.width} × {fmt.height}
                  </p>
                </div>
                <span
                  className={`text-xl ${isActive ? 'text-white' : 'text-white/20'}`}
                >
                  {isActive ? '●' : '○'}
                </span>
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label="Variaciones por formato"
        hint="Cuántas alternativas quieres por cada canal seleccionado."
      >
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map((n) => (
            <Chip
              key={n}
              active={value.variationsPerFormat === n}
              onClick={() => onChange({ ...value, variationsPerFormat: n })}
            >
              {n}
            </Chip>
          ))}
        </div>
      </Field>
    </div>
  );
}