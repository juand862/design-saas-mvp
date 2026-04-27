'use client';

import { useRef } from 'react';
import { CampaignFormData, ImageRef } from '@/lib/types';
import { Field, TextAreaInput } from './form-primitives';

type ReferencesData = CampaignFormData['references'];

const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB por imagen
const ACCEPTED_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

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
              urls: e.target.value.split('\n'),
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
              keywords: e.target.value.split('\n'),
            })
          }
          placeholder={'urban jungle\ncontraste orgánico\ngrano analógico'}
        />
      </Field>

      <ImagesUpload
        images={value.images ?? []}
        onChange={(next) => onChange({ ...value, images: next })}
      />
    </div>
  );
}

function ImagesUpload({
  images,
  onChange,
}: {
  images: ImageRef[];
  onChange: (next: ImageRef[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const slots = Math.max(0, MAX_IMAGES - images.length);
    const accepted: ImageRef[] = [];
    for (const file of Array.from(files).slice(0, slots)) {
      if (!ACCEPTED_MIMES.includes(file.type)) continue;
      if (file.size > MAX_IMAGE_BYTES) continue;
      const base64 = await fileToBase64(file);
      accepted.push({ name: file.name, mimeType: file.type, base64 });
    }
    if (accepted.length > 0) onChange([...images, ...accepted]);
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeAt = (idx: number) => {
    onChange(images.filter((_, i) => i !== idx));
  };

  return (
    <Field
      label="Imágenes de referencia"
      hint={`Logos, piezas de la marca, moodboards. Máx ${MAX_IMAGES} (${MAX_IMAGE_BYTES / 1024 / 1024} MB c/u). El Brand Analyzer las analiza con visión.`}
    >
      <div className="flex flex-col gap-4">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_MIMES.join(',')}
          disabled={images.length >= MAX_IMAGES}
          onChange={(e) => addFiles(e.target.files)}
          className="block w-full cursor-pointer border border-white/[0.12] bg-transparent py-3 px-4 text-xs text-white/70 file:mr-4 file:cursor-pointer file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-xs file:uppercase file:tracking-[0.2em] file:text-white hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
        />
        {images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {images.map((img, idx) => (
              <div
                key={`${img.name}-${idx}`}
                className="group relative aspect-square overflow-hidden border border-white/[0.08]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${img.mimeType};base64,${img.base64}`}
                  alt={img.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeAt(idx)}
                  className="absolute right-2 top-2 border border-white/30 bg-black/70 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-white/80 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Quitar
                </button>
                <span className="absolute bottom-0 left-0 right-0 truncate bg-black/70 px-2 py-1 text-[10px] text-white/70">
                  {img.name}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </Field>
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('FileReader devolvió un tipo inesperado.'));
        return;
      }
      // result es "data:<mime>;base64,<base64>". Extraemos solo la parte base64.
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}