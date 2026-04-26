'use client';

import { CampaignFormData } from '@/lib/types';
import { Field, TextAreaInput } from './form-primitives';

type ReferencesData = CampaignFormData['references'];

export function ReferencesStep({
  value,
  onChange,
}: {
  value: ReferencesData;
  onChange: (next: ReferencesData) => void;
}) {
  return (
    <div className="space-y-12">
      <Field
        label="URLs de inspiración"
        hint="Una por línea. Pinterest boards, sitios, campañas de referencia."
      >
        <TextAreaInput
          rows={5}
          value={value.urls.join('\n')}
          onChange={(e) =>
            onChange({
              ...value,
              urls: e.target.value
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder={
            'https://pinterest.com/...\nhttps://areweb.studio/...\nhttps://siteinspire.com/...'
          }
        />
      </Field>

      <Field
        label="Keywords visuales"
        hint="Una por línea. Palabras-clave de mood: 'urban jungle', 'brutalismo italiano'..."
      >
        <TextAreaInput
          rows={4}
          value={value.keywords.join('\n')}
          onChange={(e) =>
            onChange({
              ...value,
              keywords: e.target.value
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          placeholder={'urban jungle\ncontraste orgánico\ngrano analógico'}
        />
      </Field>

      <p className="font-[family-name:var(--font-display)] text-sm italic text-white/30">
        Subida de imágenes y moodboards llega con la Fase 2.
      </p>
    </div>
  );
}