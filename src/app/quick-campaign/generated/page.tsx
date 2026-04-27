'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Instrument_Serif, Geist } from 'next/font/google';
import {
  CampaignFormData,
  QUICK_CAMPAIGN_RESULT_KEY,
  QUICK_CAMPAIGN_STORAGE_KEY,
} from '@/lib/types';
import {
  clearSessionValue,
  useSessionValue,
  writeSessionValue,
} from '@/lib/session-storage';
import type {
  BrandDNA,
  BrandHistorianInsights,
  BriefAnalysis,
  CampaignGeneration,
  CopyByFormat,
  CreativeConcept,
  GeneratedImages,
  ImagePrompts,
} from '@/lib/agents/types';
import type { AgentId } from '@/lib/agents/registry';

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

type StepId = Exclude<AgentId, never>;

interface StepDef {
  id: StepId;
  name: string;
  description: string;
}

const STEPS: StepDef[] = [
  { id: 'brief-analyst', name: 'Brief Analyst', description: 'Refina y enriquece el brief.' },
  { id: 'brand-analyzer', name: 'Brand Analyzer', description: 'Consolida la identidad de marca.' },
  { id: 'brand-historian', name: 'Brand Historian', description: 'Analiza historia de marca (stub).' },
  { id: 'creative-director', name: 'Creative Director', description: 'Define el concepto creativo.' },
  { id: 'copywriter', name: 'Copywriter', description: 'Copy por formato.' },
  { id: 'art-director', name: 'Art Director', description: 'Image prompts por variación.' },
  { id: 'image-generator', name: 'Image Generator', description: 'Genera placeholders (stub).' },
];

type StepStatus = 'pending' | 'running' | 'awaiting-ok' | 'done' | 'error';

interface StepState {
  status: StepStatus;
  durationMs?: number;
  error?: string;
}

interface PipelineResults {
  brief?: BriefAnalysis;
  brand?: BrandDNA;
  history?: BrandHistorianInsights;
  concept?: CreativeConcept;
  copy?: CopyByFormat;
  imagePrompts?: ImagePrompts;
  images?: GeneratedImages;
}

export default function GeneratedPage() {
  const router = useRouter();
  const data = useSessionValue<CampaignFormData>(QUICK_CAMPAIGN_STORAGE_KEY);
  const cachedResult = useSessionValue<CampaignGeneration>(QUICK_CAMPAIGN_RESULT_KEY);

  const [results, setResults] = useState<PipelineResults>({});
  const [steps, setSteps] = useState<Record<StepId, StepState>>(() =>
    Object.fromEntries(STEPS.map((s) => [s.id, { status: 'pending' as StepStatus }])) as Record<
      StepId,
      StepState
    >,
  );
  const [activeStep, setActiveStep] = useState<StepId>('brief-analyst');
  const [pipelineDoneAt, setPipelineDoneAt] = useState<number | undefined>(undefined);
  // Lazy init: el componente se renderiza primero sin tocar Date.now() (regla
  // de pureza de React 19). El ref se completa cuando arranca el pipeline.
  const startedAtRef = useRef<number | null>(null);
  const fatalErrorRef = useRef<boolean>(false);

  // Si vienen sin form data, vuelvo al wizard.
  useEffect(() => {
    if (data === undefined) return;
    if (data === null) {
      const id = window.setTimeout(() => router.replace('/quick-campaign'), 50);
      return () => window.clearTimeout(id);
    }
  }, [data, router]);

  // Sincroniza el resultado cacheado de sessionStorage al estado de la UI.
  // setState dentro del effect es intencional (hook async → estado).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!cachedResult) return;
    setResults({
      brief: cachedResult.brief,
      brand: cachedResult.brand,
      history: cachedResult.history,
      concept: cachedResult.concept,
      copy: cachedResult.copy,
      imagePrompts: cachedResult.imagePrompts,
      images: cachedResult.images,
    });
    setSteps((prev) => {
      const next = { ...prev };
      for (const s of STEPS) next[s.id] = { status: 'done' };
      return next;
    });
    setPipelineDoneAt(Date.parse(cachedResult.meta.generatedAt));
  }, [cachedResult]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const runStep = useCallback(
    async (stepId: StepId, currentResults: PipelineResults) => {
      if (!data) return;
      setSteps((prev) => ({ ...prev, [stepId]: { status: 'running' } }));

      const t0 = Date.now();
      try {
        const res = await callStep(stepId, data, currentResults);
        const duration = Date.now() - t0;
        const merged: PipelineResults = mergeStepResult(currentResults, stepId, res);
        setResults(merged);
        const isLast = stepId === 'image-generator';
        const newStatus: StepStatus = isLast ? 'done' : 'awaiting-ok';
        setSteps((prev) => ({
          ...prev,
          [stepId]: { status: newStatus, durationMs: duration },
        }));
        if (
          isLast &&
          merged.brief &&
          merged.brand &&
          merged.history &&
          merged.concept &&
          merged.copy &&
          merged.imagePrompts &&
          merged.images
        ) {
          const startedAt = startedAtRef.current ?? Date.now();
          const generation: CampaignGeneration = {
            input: data,
            brief: merged.brief,
            brand: merged.brand,
            history: merged.history,
            concept: merged.concept,
            copy: merged.copy,
            imagePrompts: merged.imagePrompts,
            images: merged.images,
            meta: {
              durationMs: Date.now() - startedAt,
              model: 'claude-sonnet-4-6',
              generatedAt: new Date().toISOString(),
              stubsUsed: [
                ...(merged.history.isStub ? ['brand-historian'] : []),
                ...(merged.images.images.some((i) => i.isPlaceholder) ? ['image-generation'] : []),
                'layout-composer',
              ],
            },
          };
          writeSessionValue(QUICK_CAMPAIGN_RESULT_KEY, generation);
          setPipelineDoneAt(Date.now());
        }
      } catch (err) {
        fatalErrorRef.current = true;
        const message = err instanceof Error ? err.message : 'Error desconocido.';
        setSteps((prev) => ({
          ...prev,
          [stepId]: { status: 'error', error: message },
        }));
      }
    },
    [data],
  );

  // Auto-run primer paso. Disparo manual cuando llegan los datos del wizard.
  /* eslint-disable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!data || cachedResult || fatalErrorRef.current) return;
    if (steps['brief-analyst'].status === 'pending') {
      startedAtRef.current = Date.now();
      runStep('brief-analyst', {});
    }
  }, [data, cachedResult]);
  /* eslint-enable react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */

  const onContinue = (currentStepId: StepId) => {
    const idx = STEPS.findIndex((s) => s.id === currentStepId);
    if (idx === -1 || idx === STEPS.length - 1) return;
    const next = STEPS[idx + 1].id;
    setActiveStep(next);
    runStep(next, results);
  };

  const onRetry = (stepId: StepId) => {
    fatalErrorRef.current = false;
    runStep(stepId, results);
  };

  const onRegenerar = () => {
    if (!data) return;
    clearSessionValue(QUICK_CAMPAIGN_RESULT_KEY);
    setResults({});
    setSteps(
      Object.fromEntries(STEPS.map((s) => [s.id, { status: 'pending' as StepStatus }])) as Record<
        StepId,
        StepState
      >,
    );
    setActiveStep('brief-analyst');
    setPipelineDoneAt(undefined);
    fatalErrorRef.current = false;
    startedAtRef.current = Date.now();
    runStep('brief-analyst', {});
  };

  const onNueva = () => {
    clearSessionValue(QUICK_CAMPAIGN_STORAGE_KEY);
    clearSessionValue(QUICK_CAMPAIGN_RESULT_KEY);
    router.push('/quick-campaign');
  };

  const allDone = pipelineDoneAt !== undefined;

  if (!data) {
    return (
      <Shell>
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <p className="font-[family-name:var(--font-display)] text-2xl italic text-white/40">
            Recuperando campaña…
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Header pieceCount={results.images?.images.length ?? null} />
      <section className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">
          {allDone ? 'Resultado' : 'Pipeline en curso'}
        </p>
        <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-display)] text-4xl italic leading-tight tracking-tight text-white md:text-5xl">
          {allDone ? results.concept?.conceptoCentral : 'Generando paso a paso…'}
        </h1>
        {!allDone ? (
          <p className="mt-6 max-w-xl text-sm text-white/50">
            Cada agente corre uno a la vez. Cuando termina, revisás el resultado y das OK para
            avanzar al siguiente.
          </p>
        ) : (
          <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/60">
            {results.concept?.directionJustification}
          </p>
        )}

        <div className="mt-12 space-y-3">
          {STEPS.map((step, idx) => (
            <StepCard
              key={step.id}
              step={step}
              order={idx + 1}
              state={steps[step.id]}
              isActive={step.id === activeStep}
              result={pickResult(results, step.id)}
              onContinue={() => onContinue(step.id)}
              onRetry={() => onRetry(step.id)}
              isLast={idx === STEPS.length - 1}
            />
          ))}
        </div>

        {allDone && results.images && results.copy && results.imagePrompts ? (
          <FinalGrid
            images={results.images}
            copy={results.copy}
            prompts={results.imagePrompts}
          />
        ) : null}

        {allDone ? (
          <div className="mt-20 flex flex-col items-center gap-4 border-t border-white/[0.08] pt-8 sm:flex-row sm:justify-between">
            <Link
              href="/quick-campaign"
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              ← Volver a editar
            </Link>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onRegenerar}
                className="border border-white/[0.12] px-6 py-3 text-sm text-white transition-colors hover:border-white/[0.30]"
              >
                Regenerar
              </button>
              <button
                type="button"
                onClick={onNueva}
                className="bg-white px-6 py-3 text-sm text-black transition-colors hover:bg-white/90"
              >
                Nueva campaña →
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main
      className={`${display.variable} ${sans.variable} min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans antialiased`}
    >
      {children}
    </main>
  );
}

function Header({ pieceCount }: { pieceCount: number | null }) {
  return (
    <header className="border-b border-white/[0.08]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href="/quick-campaign"
          className="flex items-center gap-3 text-sm text-white/60 transition-colors hover:text-white"
        >
          <span className="text-base">←</span>
          <span className="tracking-[0.2em]">CANVAS</span>
        </Link>
        <p className="text-xs uppercase tracking-[0.25em] text-white/40">Pipeline · paso a paso</p>
        <Link
          href="/admin/login"
          className="text-xs uppercase tracking-[0.25em] text-white/60 transition-colors hover:text-white"
        >
          {pieceCount === null ? 'Admin' : `${pieceCount} pieza(s)`}
        </Link>
      </div>
    </header>
  );
}

function StepCard({
  step,
  order,
  state,
  isActive,
  result,
  onContinue,
  onRetry,
  isLast,
}: {
  step: StepDef;
  order: number;
  state: StepState;
  isActive: boolean;
  result: unknown;
  onContinue: () => void;
  onRetry: () => void;
  isLast: boolean;
}) {
  const seconds = state.durationMs !== undefined ? (state.durationMs / 1000).toFixed(1) : null;
  return (
    <article
      className={`border p-6 transition-colors ${
        isActive ? 'border-white/[0.30]' : 'border-white/[0.08]'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
            #{order} · {step.id}
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-2xl text-white">
            {step.name}
          </h2>
          <p className="mt-1 text-xs text-white/50">{step.description}</p>
        </div>
        <StatusBadge status={state.status} seconds={seconds} />
      </div>

      {state.status === 'running' ? (
        <p className="mt-6 text-sm italic text-white/50">Ejecutando…</p>
      ) : null}

      {state.status === 'error' ? (
        <div className="mt-6 space-y-4">
          <pre className="overflow-x-auto whitespace-pre-wrap border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-200/80">
            {state.error}
          </pre>
          <button
            type="button"
            onClick={onRetry}
            className="border border-white/[0.12] px-4 py-2 text-xs text-white transition-colors hover:border-white/[0.30]"
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {(state.status === 'awaiting-ok' || state.status === 'done') && result !== undefined ? (
        <div className="mt-6">
          <ResultPreview stepId={step.id} result={result} />
          {state.status === 'awaiting-ok' && !isLast ? (
            <button
              type="button"
              onClick={onContinue}
              className="mt-6 bg-white px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-black transition-colors hover:bg-white/90"
            >
              Continuar →
            </button>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

function StatusBadge({ status, seconds }: { status: StepStatus; seconds: string | null }) {
  const label = (() => {
    switch (status) {
      case 'pending':
        return 'esperando';
      case 'running':
        return 'corriendo';
      case 'awaiting-ok':
        return seconds ? `OK · ${seconds}s` : 'OK';
      case 'done':
        return seconds ? `done · ${seconds}s` : 'done';
      case 'error':
        return 'error';
    }
  })();
  const color = (() => {
    switch (status) {
      case 'pending':
        return 'border-white/[0.12] text-white/40';
      case 'running':
        return 'border-amber-500/30 text-amber-200/70';
      case 'awaiting-ok':
        return 'border-emerald-500/30 text-emerald-200/70';
      case 'done':
        return 'border-emerald-500/30 text-emerald-200/70';
      case 'error':
        return 'border-red-500/30 text-red-200/70';
    }
  })();
  return (
    <span className={`whitespace-nowrap border px-3 py-1 text-[10px] uppercase tracking-[0.2em] ${color}`}>
      {label}
    </span>
  );
}

function ResultPreview({ stepId, result }: { stepId: StepId; result: unknown }) {
  if (!result) return null;
  if (stepId === 'brief-analyst') {
    const r = result as BriefAnalysis;
    return (
      <Block>
        <Row label="Objetivo" value={r.objetivo} />
        <Row label="Audiencia" value={r.audiencia} />
        <Row label="Tono" value={r.tono} />
        <Row label="Ocasión" value={r.ocasion} />
        <Row label="CTA" value={r.cta} />
        {r.insightsAdicionales.length > 0 ? (
          <div className="mt-3">
            <p className="uppercase tracking-[0.25em] text-white/40">Insights</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-white/60">
              {r.insightsAdicionales.map((i, idx) => (
                <li key={idx}>{i}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Block>
    );
  }
  if (stepId === 'brand-analyzer') {
    const r = result as BrandDNA;
    return (
      <Block>
        <Row
          label="Paleta"
          value={`${r.colorPalette.primary} · ${r.colorPalette.secondary} · ${r.colorPalette.accent}`}
        />
        <Row label="Tipografía" value={`${r.typography.headline} / ${r.typography.body}`} />
        <Row label="Estilo" value={r.visualStyle.join(', ')} />
        <Row label="Tono de voz" value={r.toneKeywords.join(', ')} />
      </Block>
    );
  }
  if (stepId === 'brand-historian') {
    const r = result as BrandHistorianInsights;
    return (
      <Block>
        {r.isStub ? (
          <p className="text-amber-200/70">Stub — sin historia previa de la marca.</p>
        ) : (
          <Row label="Consistent" value={r.brandEvolution.consistentElements.join(', ')} />
        )}
      </Block>
    );
  }
  if (stepId === 'creative-director') {
    const r = result as CreativeConcept;
    return (
      <Block>
        <p className="font-[family-name:var(--font-display)] text-xl italic text-white">
          {r.conceptoCentral}
        </p>
        <p className="mt-3 text-white/60">{r.directionJustification}</p>
        <Row
          label="Paleta evolucionada"
          value={`${r.paleta.base} · ${r.paleta.evolution} · ${r.paleta.accent}`}
        />
        <Row label="Mood" value={r.moodKeywords.join(', ')} />
      </Block>
    );
  }
  if (stepId === 'copywriter') {
    const r = result as CopyByFormat;
    return (
      <div className="space-y-4">
        {r.pieces.map((p) => (
          <div key={p.format} className="border border-white/[0.08] p-4">
            <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">{p.format}</p>
            <p className="mt-2 font-[family-name:var(--font-display)] text-lg text-white">
              {p.headline}
            </p>
            {p.subhead ? <p className="mt-1 text-sm text-white/70">{p.subhead}</p> : null}
            {p.body ? <p className="mt-1 text-xs text-white/50">{p.body}</p> : null}
            {p.cta ? (
              <p className="mt-2 inline-block bg-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-white/80">
                {p.cta}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    );
  }
  if (stepId === 'art-director') {
    const r = result as ImagePrompts;
    return (
      <div className="space-y-3">
        {r.prompts.map((p, idx) => (
          <details key={idx} className="cursor-pointer border border-white/[0.08] p-3 text-xs">
            <summary className="select-none uppercase tracking-[0.2em] text-white/60">
              {p.format} · v{p.variation}
            </summary>
            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-white/60">{p.prompt}</p>
          </details>
        ))}
      </div>
    );
  }
  if (stepId === 'image-generator') {
    const r = result as GeneratedImages;
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {r.images.map((img) => (
          <div
            key={`${img.format}-${img.variation}`}
            className="aspect-square overflow-hidden border border-white/[0.08]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img.url} alt={`${img.format} v${img.variation}`} className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    );
  }
  return null;
}

function FinalGrid({
  images,
  copy,
  prompts,
}: {
  images: GeneratedImages;
  copy: CopyByFormat;
  prompts: ImagePrompts;
}) {
  return (
    <section className="mt-20 border-t border-white/[0.08] pt-12">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">Piezas finales</p>
      <div className="mt-8 grid grid-cols-1 gap-12 md:grid-cols-2">
        {images.images.map((img) => {
          const piece = copy.pieces.find((c) => c.format === img.format);
          const pr = prompts.prompts.find((p) => p.format === img.format && p.variation === img.variation);
          return (
            <article key={`${img.format}-${img.variation}`}>
              <div
                className="relative w-full overflow-hidden border border-white/[0.08]"
                style={{ aspectRatio: `${img.width} / ${img.height}` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={`${img.format} v${img.variation}`} className="h-full w-full object-cover" />
                {img.isPlaceholder ? (
                  <span className="absolute right-2 top-2 border border-white/30 bg-black/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-white/70">
                    placeholder
                  </span>
                ) : null}
              </div>
              <div className="mt-3 flex items-baseline justify-between text-xs text-white/60">
                <span className="uppercase tracking-[0.2em]">{img.format}</span>
                <span className="text-white/30">v{img.variation}</span>
              </div>
              {piece ? (
                <div className="mt-3">
                  <p className="font-[family-name:var(--font-display)] text-xl text-white">
                    {piece.headline}
                  </p>
                  {piece.subhead ? <p className="mt-1 text-sm text-white/70">{piece.subhead}</p> : null}
                </div>
              ) : null}
              {pr ? (
                <details className="mt-3 cursor-pointer text-[11px] text-white/40">
                  <summary className="uppercase tracking-[0.25em]">Prompt</summary>
                  <p className="mt-2 whitespace-pre-wrap text-white/50">{pr.prompt}</p>
                </details>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Block({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2 text-xs leading-relaxed text-white/60">{children}</div>;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-white/40">{label}: </span>
      <span className="text-white/70">{value}</span>
    </div>
  );
}

function pickResult(results: PipelineResults, stepId: StepId): unknown {
  switch (stepId) {
    case 'brief-analyst':
      return results.brief;
    case 'brand-analyzer':
      return results.brand;
    case 'brand-historian':
      return results.history;
    case 'creative-director':
      return results.concept;
    case 'copywriter':
      return results.copy;
    case 'art-director':
      return results.imagePrompts;
    case 'image-generator':
      return results.images;
  }
}

function mergeStepResult(
  current: PipelineResults,
  stepId: StepId,
  result: unknown,
): PipelineResults {
  switch (stepId) {
    case 'brief-analyst':
      return { ...current, brief: result as BriefAnalysis };
    case 'brand-analyzer':
      return { ...current, brand: result as BrandDNA };
    case 'brand-historian':
      return { ...current, history: result as BrandHistorianInsights };
    case 'creative-director':
      return { ...current, concept: result as CreativeConcept };
    case 'copywriter':
      return { ...current, copy: result as CopyByFormat };
    case 'art-director':
      return { ...current, imagePrompts: result as ImagePrompts };
    case 'image-generator':
      return { ...current, images: result as GeneratedImages };
  }
}

async function callStep(
  stepId: StepId,
  data: CampaignFormData,
  results: PipelineResults,
): Promise<unknown> {
  const post = async (path: string, body: unknown) => {
    const res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Error desconocido.');
    return json.data;
  };

  switch (stepId) {
    case 'brief-analyst':
      return post('/api/agents/brief-analyst', { brief: data.brief });
    case 'brand-analyzer':
      return post('/api/agents/brand-analyzer', {
        brand: data.brand,
        references: data.references,
      });
    case 'brand-historian':
      return post('/api/agents/brand-historian', {});
    case 'creative-director':
      if (!results.brief || !results.brand || !results.history) {
        throw new Error('Faltan resultados anteriores para Creative Director.');
      }
      return post('/api/agents/creative-director', {
        brief: results.brief,
        brand: results.brand,
        history: results.history,
      });
    case 'copywriter':
      if (!results.brief || !results.brand || !results.concept) {
        throw new Error('Faltan resultados anteriores para Copywriter.');
      }
      return post('/api/agents/copywriter', {
        brief: results.brief,
        brand: results.brand,
        concept: results.concept,
        formats: data.output.formats,
      });
    case 'art-director':
      if (!results.brief || !results.brand || !results.concept || !results.copy) {
        throw new Error('Faltan resultados anteriores para Art Director.');
      }
      return post('/api/agents/art-director', {
        brief: results.brief,
        brand: results.brand,
        concept: results.concept,
        copy: results.copy,
        formats: data.output.formats,
        variationsPerFormat: data.output.variationsPerFormat,
      });
    case 'image-generator':
      if (!results.brand || !results.copy || !results.imagePrompts) {
        throw new Error('Faltan resultados anteriores para Image Generator.');
      }
      return post('/api/agents/image-generator', {
        prompts: results.imagePrompts,
        brand: results.brand,
        copy: results.copy,
      });
  }
}
