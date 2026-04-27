'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Instrument_Serif, Geist } from 'next/font/google';
import {
  CampaignFormData,
  ImageRef,
  INITIAL_FORM_DATA,
  QUICK_CAMPAIGN_RESULT_KEY,
  QUICK_CAMPAIGN_STORAGE_KEY,
} from '@/lib/types';
import {
  clearSessionValue,
  useSessionValue,
  writeSessionValue,
} from '@/lib/session-storage';
import { CampaignForm } from './_components/CampaignForm';
import { validateCampaign } from './_components/validation';

const display = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  style: ['normal', 'italic'],
  variable: '--font-display',
});

const sans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const STEPS = [
  { id: 1, label: 'Brief de Campaña', hint: 'Objetivo, audiencia, tono' },
  { id: 2, label: 'Brand Guidelines', hint: 'Colores, tipografías, estilo' },
  { id: 3, label: 'Referencias Visuales', hint: 'Inspiración y mood' },
  { id: 4, label: 'Output Specs', hint: 'Canales y formatos' },
  { id: 5, label: 'Preview & Generate', hint: 'Revisar y producir' },
];

export default function QuickCampaignPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);
  const stored = useSessionValue<CampaignFormData>(QUICK_CAMPAIGN_STORAGE_KEY);
  const data = stored ?? INITIAL_FORM_DATA;
  const setData = (next: CampaignFormData) =>
    writeSessionValue(QUICK_CAMPAIGN_STORAGE_KEY, next);

  const current = STEPS.find((s) => s.id === activeStep);
  const issues = activeStep === 5 ? validateCampaign(data) : [];

  const handleGenerate = () => {
    const found = validateCampaign(data);
    if (found.length > 0) return;
    writeSessionValue(QUICK_CAMPAIGN_STORAGE_KEY, data);
    router.push('/quick-campaign/generated');
  };

  return (
    <main
      className={`${display.variable} ${sans.variable} min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans antialiased`}
    >
      <header className="border-b border-white/[0.08]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link
            href="/"
            className="flex items-center gap-3 text-sm text-white/60 transition-colors hover:text-white"
          >
            <span className="text-base">←</span>
            <span className="tracking-[0.2em]">CANVAS</span>
          </Link>
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Campaña Rápida</p>
          <Link
            href="/admin/login"
            className="text-xs uppercase tracking-[0.25em] text-white/60 transition-colors hover:text-white"
          >
            Admin
          </Link>
        </div>
      </header>

      <DemoBanner />

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-[280px_1fr] lg:py-16">
        <aside className="lg:sticky lg:top-12 lg:self-start">
          <p className="mb-8 text-[10px] uppercase tracking-[0.3em] text-white/40">
            Progreso técnico
          </p>
          <ol className="space-y-1">
            {STEPS.map((step) => {
              const isActive = activeStep === step.id;
              const isCompleted = activeStep > step.id;
              return (
                <li key={step.id}>
                  <button
                    onClick={() => setActiveStep(step.id)}
                    className={`flex w-full items-start gap-4 border-l-2 px-4 py-3 text-left text-sm transition-all ${
                      isActive
                        ? 'border-white bg-white/[0.03] text-white'
                        : isCompleted
                          ? 'border-white/30 text-white/60 hover:text-white'
                          : 'border-white/[0.08] text-white/30 hover:text-white/60'
                    }`}
                  >
                    <span className="font-[family-name:var(--font-display)] text-lg italic leading-none">
                      {String(step.id).padStart(2, '0')}
                    </span>
                    <span className="flex-1">
                      <span className="block">{step.label}</span>
                      <span className="mt-0.5 block text-[11px] text-white/30">
                        {step.hint}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </aside>

        <section>
          <div className="mb-12">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Paso {String(activeStep).padStart(2, '0')} / 05
            </p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-tight tracking-tight text-white">
              {current?.label}
            </h1>
            <p className="mt-3 text-sm text-white/50">{current?.hint}</p>
          </div>

          <CampaignForm
            activeStep={activeStep}
            data={data}
            onChange={setData}
            issues={issues}
            onJumpTo={setActiveStep}
          />

          <div className="mt-12 flex items-center justify-between border-t border-white/[0.08] pt-8">
            <button
              onClick={() => setActiveStep((s) => Math.max(1, s - 1))}
              disabled={activeStep === 1}
              className="text-sm text-white/50 transition-colors hover:text-white disabled:opacity-30 disabled:hover:text-white/50"
            >
              ← Atrás
            </button>
            {activeStep < STEPS.length ? (
              <button
                onClick={() => setActiveStep((s) => Math.min(STEPS.length, s + 1))}
                className="bg-white px-6 py-3 text-sm text-black transition-colors hover:bg-white/90"
              >
                Continuar →
              </button>
            ) : (
              <button
                onClick={handleGenerate}
                className="bg-white px-6 py-3 text-sm text-black transition-colors hover:bg-white/90"
              >
                Generar campaña →
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

/**
 * Banner temporal para guías de prueba: prefilea el wizard con datos de
 * "Mother's Day Leonisa USA" + permite adjuntar el .md de guidelines y
 * fotos de referencia para que Brand Analyzer y Art Director las usen.
 * Quitar cuando termine la fase de demo.
 */
function DemoBanner() {
  const router = useRouter();
  const mdInputRef = useRef<HTMLInputElement>(null);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | undefined>(undefined);
  const [markdown, setMarkdown] = useState<string | undefined>(undefined);
  const [images, setImages] = useState<ImageRef[]>([]);
  const [busy, setBusy] = useState(false);

  const onPickMd = async (file: File) => {
    const text = await file.text();
    setFileName(file.name);
    setMarkdown(text);
  };

  const onClearMd = () => {
    setFileName(undefined);
    setMarkdown(undefined);
    if (mdInputRef.current) mdInputRef.current.value = '';
  };

  const onPickImages = async (files: FileList | null) => {
    if (!files) return;
    const accepted: ImageRef[] = [];
    const slots = Math.max(0, 6 - images.length);
    const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const MAX_BYTES = 4 * 1024 * 1024;
    for (const file of Array.from(files).slice(0, slots)) {
      if (!ACCEPTED.includes(file.type)) continue;
      if (file.size > MAX_BYTES) continue;
      const base64 = await fileToBase64(file);
      accepted.push({ name: file.name, mimeType: file.type, base64 });
    }
    if (accepted.length > 0) setImages([...images, ...accepted]);
    if (imgInputRef.current) imgInputRef.current.value = '';
  };

  const onClearImages = () => setImages([]);

  const onRun = () => {
    if (!markdown) return;
    setBusy(true);
    const demoData: CampaignFormData = {
      brief: {
        objetivo:
          "Crear campaña de Mother's day para Leonisa USA. Debes basarte en los guidelines del md adjunto.",
        audiencia: 'Mujeres latinas en USA, 30-55 años, con hijos.',
        tono: 'Cálido, emotivo, celebratorio.',
        ocasion: "Mother's Day 2026 (mayo).",
        cta: 'Comprá el regalo perfecto',
        restricciones: [],
        campaignType: 'promotional',
      },
      brand: {
        colors: { primary: '#0A0A0A', secondary: '#F5F5F5', accent: '#E91E63' },
        typography: { headline: 'Playfair Display', body: 'Inter' },
        style: ['editorial', 'bold'],
        guidelinesMarkdown: markdown,
        guidelinesFileName: fileName,
      },
      references: {
        urls: [],
        keywords: ['femenino', 'familiar', 'celebración'],
        images,
      },
      output: {
        // Demo limitada a 1 formato × 2 variaciones (= 2 imágenes Replicate)
        // para acotar tiempo y costo del test.
        formats: ['instagram-square'],
        variationsPerFormat: 2,
      },
    };
    writeSessionValue(QUICK_CAMPAIGN_STORAGE_KEY, demoData);
    clearSessionValue(QUICK_CAMPAIGN_RESULT_KEY);
    router.push('/quick-campaign/generated');
  };

  return (
    <section className="border-b border-white/[0.08] bg-amber-500/[0.04]">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase tracking-[0.3em] text-amber-200/70">
            Demo · temporal
          </span>
          <span className="mt-1 text-sm text-white/80">
            Mother&apos;s Day Leonisa USA — adjuntá el .md de guidelines y/o fotos de referencia.
            Brand Analyzer y Art Director las usan para que el output visual matchee la marca.
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <input
              ref={mdInputRef}
              type="file"
              accept=".md,text/markdown,text/plain"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onPickMd(file);
              }}
              className="block w-full cursor-pointer border border-white/[0.12] bg-transparent py-2 px-3 text-xs text-white/70 file:mr-3 file:cursor-pointer file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-[10px] file:uppercase file:tracking-[0.2em] file:text-white hover:border-white/30"
            />
            {fileName ? (
              <span className="flex shrink-0 items-center gap-2 text-xs text-emerald-200/80">
                {fileName}
                <button
                  type="button"
                  onClick={onClearMd}
                  className="text-emerald-200/60 hover:text-emerald-200/90"
                >
                  ×
                </button>
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={imgInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={images.length >= 6}
              onChange={(e) => onPickImages(e.target.files)}
              className="block w-full cursor-pointer border border-white/[0.12] bg-transparent py-2 px-3 text-xs text-white/70 file:mr-3 file:cursor-pointer file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-[10px] file:uppercase file:tracking-[0.2em] file:text-white hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-40"
            />
            {images.length > 0 ? (
              <span className="flex shrink-0 items-center gap-2 text-xs text-emerald-200/80">
                {images.length} foto{images.length === 1 ? '' : 's'}
                <button
                  type="button"
                  onClick={onClearImages}
                  className="text-emerald-200/60 hover:text-emerald-200/90"
                >
                  ×
                </button>
              </span>
            ) : null}
          </div>
        </div>

        {images.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {images.map((img, idx) => (
              <div
                key={`${img.name}-${idx}`}
                className="h-12 w-12 overflow-hidden border border-white/[0.08]"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:${img.mimeType};base64,${img.base64}`}
                  alt={img.name}
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onRun}
            disabled={!markdown || busy}
            className="bg-amber-100 px-5 py-2 text-xs uppercase tracking-[0.2em] text-amber-950 transition-colors hover:bg-amber-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Cargando…' : 'Ejecutar pipeline →'}
          </button>
        </div>
      </div>
    </section>
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
      const comma = result.indexOf(',');
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
