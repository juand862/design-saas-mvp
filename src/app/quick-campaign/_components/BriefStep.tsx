'use client';

import { CampaignFormData, CAMPAIGN_TYPE_OPTIONS, CampaignType } from '@/lib/types';
import { Field, TextInput, TextAreaInput, ChipGroup } from './form-primitives';

type BriefData = CampaignFormData['brief'];

export function BriefStep({
  value,
  onChange,
}: {
  value: BriefData;
  onChange: (next: BriefData) => void;
}) {
  const update = <K extends keyof BriefData>(key: K, v: BriefData[K]) =>
    onChange({ ...value, [key]: v });

  return (
    <div className="space-y-12">
      <Field label="Tipo de campaña">
        <ChipGroup<CampaignType>
          options={CAMPAIGN_TYPE_OPTIONS}
          value={value.campaignType}
          onChange={(v) => update('campaignType', v as CampaignType)}
        />
      </Field>

      <Field label="Objetivo" hint="¿Qué tiene que pasar al final de la campaña?">
        <TextAreaInput
          rows={2}
          value={value.objetivo}
          onChange={(e) => update('objetivo', e.target.value)}
          placeholder="Impulsar ventas Black Friday con foco en nuevos clientes."
        />
      </Field>

      <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
        <Field label="Audiencia">
          <TextInput
            value={value.audiencia}
            onChange={(e) => update('audiencia', e.target.value)}
            placeholder="Hombres y mujeres 18-35, urbanos."
          />
        </Field>

        <Field label="Tono">
          <TextInput
            value={value.tono}
            onChange={(e) => update('tono', e.target.value)}
            placeholder="Rebelde, auténtico."
          />
        </Field>

        <Field label="Ocasión">
          <TextInput
            value={value.ocasion}
            onChange={(e) => update('ocasion', e.target.value)}
            placeholder="Black Friday 2026."
          />
        </Field>

        <Field label="Call to action">
          <TextInput
            value={value.cta}
            onChange={(e) => update('cta', e.target.value)}
            placeholder="Compra ahora con 40% descuento."
          />
        </Field>
      </div>

      <Field
        label="Restricciones"
        hint="Una por línea. Cosas a evitar, no-gos de marca, sensibilidades."
      >
        <TextAreaInput
          rows={4}
          value={value.restricciones.join('\n')}
          onChange={(e) =>
            update(
              'restricciones',
              e.target.value
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
            )
          }
          placeholder={'No precios específicos\nEvitar rojo navideño'}
        />
      </Field>
    </div>
  );
}