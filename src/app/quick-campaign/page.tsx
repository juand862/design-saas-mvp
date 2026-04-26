'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Instrument_Serif, Geist } from 'next/font/google';

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

// Pasos según el spec (Step 0 de marca se omite en modo rápido)
const STEPS = [
  { id: 1, label: 'Brief de Campaña', hint: 'Objetivo, audiencia, tono' },
  { id: 2, label: 'Brand Guidelines', hint: 'Colores, tipografías, logos' },
  { id: 3, label: 'Referencias Visuales', hint: 'Inspiración y mood' },
  { id: 4, label: 'Output Specs', hint: 'Canales y formatos' },
  { id: 5, label: 'Preview & Generate', hint: 'Revisar y producir' },
];

export default function QuickCampaignPage() {
  const [activeStep, setActiveStep] = useState(1);
  const current = STEPS.find((s) => s.id === activeStep);

  return (
    <main
      className={`${display.variable} ${sans.variable} min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans antialiased`}
    >
      {/* Top Bar */}
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
          <div className="text-xs text-white/40">Sin marca configurada</div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-[280px_1fr] lg:py-16">
        {/* Sidebar - Step Indicator */}
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

        {/* Main Content - Wizard */}
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

          {/* TODO: Mover aquí la UI del wizard que vivía en page.tsx (showProduct === true).
              Sugerencia: extraer cada paso a su propio componente:
              <BriefStep />, <BrandStep />, <ReferencesStep />, <OutputStep />, <PreviewStep />
              y renderizar condicional sobre activeStep. */}
          <div className="border border-dashed border-white/[0.12] bg-white/[0.01] p-12">
            <p className="font-[family-name:var(--font-display)] text-2xl italic text-white/40">
              Contenido del paso {activeStep}
            </p>
            <p className="mt-3 text-sm text-white/50">
              Pegar aquí el componente del wizard correspondiente.
            </p>
          </div>

          {/* Nav */}
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
              <button className="bg-white px-6 py-3 text-sm text-black transition-colors hover:bg-white/90">
                Generar campaña →
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
