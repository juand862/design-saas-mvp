'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
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
import type { CampaignGeneration } from '@/lib/agents/types';

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

export default function GeneratedPage() {
  const router = useRouter();
  const data = useSessionValue<CampaignFormData>(QUICK_CAMPAIGN_STORAGE_KEY);
  const cachedResult = useSessionValue<CampaignGeneration>(QUICK_CAMPAIGN_RESULT_KEY);

  const [result, setResult] = useState<CampaignGeneration | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Si vienen sin form data, vuelvo al wizard.
  useEffect(() => {
    if (data === undefined) return;
    if (data === null) {
      const id = window.setTimeout(() => router.replace('/quick-campaign'), 50);
      return () => window.clearTimeout(id);
    }
  }, [data, router]);

  // Si hay resultado cacheado, lo mostramos sin llamar API.
  useEffect(() => {
    if (cachedResult && !result) setResult(cachedResult);
  }, [cachedResult, result]);

  const runPipeline = useCallback(
    async (campaign: CampaignFormData) => {
      setLoading(true);
      setError(undefined);
      try {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ campaign }),
        });
        const json: { ok: boolean; data?: CampaignGeneration; error?: string } =
          await res.json();
        if (!json.ok || !json.data) throw new Error(json.error || 'Error desconocido.');
        setResult(json.data);
        writeSessionValue(QUICK_CAMPAIGN_RESULT_KEY, json.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido.');
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Si tengo data pero no resultado y no está cargando, arranco pipeline.
  useEffect(() => {
    if (!data) return;
    if (result || loading || error) return;
    if (cachedResult) return;
    runPipeline(data);
  }, [data, result, loading, error, cachedResult, runPipeline]);

  const handleRegenerar = () => {
    if (!data) return;
    clearSessionValue(QUICK_CAMPAIGN_RESULT_KEY);
    setResult(undefined);
    setError(undefined);
    runPipeline(data);
  };

  const handleNueva = () => {
    clearSessionValue(QUICK_CAMPAIGN_STORAGE_KEY);
    clearSessionValue(QUICK_CAMPAIGN_RESULT_KEY);
    router.push('/quick-campaign');
  };

  if (!data) {
    return (
      <Shell>
        <Centered>
          <p className="font-[family-name:var(--font-display)] text-2xl italic text-white/40">
            Recuperando campaña...
          </p>
        </Centered>
      </Shell>
    );
  }

  if (loading) {
    return (
      <Shell>
        <Header pieceCount={null} />
        <LoadingState />
      </Shell>
    );
  }

  if (error) {
    return (
      <Shell>
        <Header pieceCount={null} />
        <ErrorState error={error} onRetry={handleRegenerar} />
      </Shell>
    );
  }

  if (!result) {
    return (
      <Shell>
        <Centered>
          <p className="font-[family-name:var(--font-display)] text-2xl italic text-white/40">
            Esperando resultado...
          </p>
        </Centered>
      </Shell>
    );
  }

  return (
    <Shell>
      <Header pieceCount={result.images.images.length} />
      <ResultView
        data={data}
        result={result}
        onRegenerar={handleRegenerar}
        onNueva={handleNueva}
      />
    </Shell>
  );

  function Shell({ children }: { children: React.ReactNode }) {
    return (
      <main
        className={`${display.variable} ${sans.variable} min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans antialiased`}
      >
        {children}
      </main>
    );
  }
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
        <p className="text-xs uppercase tracking-[0.25em] text-white/40">Campaña generada</p>
        <div className="text-xs text-white/40">
          {pieceCount === null ? '—' : `${pieceCount} pieza(s)`}
        </div>
      </div>
    </header>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
      {children}
    </div>
  );
}

function LoadingState() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">Pipeline</p>
      <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-display)] text-5xl italic leading-tight tracking-tight text-white md:text-6xl">
        Generando…
      </h1>
      <p className="mt-6 max-w-xl text-sm text-white/50">
        5 agentes Claude en secuencia: Brief Analyst → Brand Analyzer → Creative Director → Copywriter → Art Director. Suele tardar 45-60 segundos.
      </p>
      <div className="mt-12 flex max-w-md flex-col gap-2 text-xs text-white/40">
        {[
          'Brief Analyst',
          'Brand Analyzer',
          'Brand Historian (sin historia)',
          'Creative Director',
          'Copywriter',
          'Art Director',
          'Image Generation (placeholders)',
        ].map((s) => (
          <div key={s} className="flex items-center gap-3 border-b border-white/[0.05] pb-2">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white/40" />
            <span className="tracking-wide">{s}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <section className="mx-auto max-w-3xl px-6 py-24">
      <p className="text-xs uppercase tracking-[0.3em] text-red-400/70">Falló el pipeline</p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-tight tracking-tight text-white">
        No pudimos generar la campaña.
      </h1>
      <pre className="mt-8 overflow-x-auto whitespace-pre-wrap border border-red-500/20 bg-red-500/5 p-4 text-xs text-red-200/80">
        {error}
      </pre>
      <div className="mt-10 flex gap-4">
        <button
          type="button"
          onClick={onRetry}
          className="bg-white px-6 py-3 text-sm text-black transition-colors hover:bg-white/90"
        >
          Reintentar
        </button>
        <Link
          href="/quick-campaign"
          className="border border-white/[0.12] px-6 py-3 text-sm text-white transition-colors hover:border-white/[0.30]"
        >
          Volver al wizard
        </Link>
      </div>
    </section>
  );
}

function ResultView({
  data,
  result,
  onRegenerar,
  onNueva,
}: {
  data: CampaignFormData;
  result: CampaignGeneration;
  onRegenerar: () => void;
  onNueva: () => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-16">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">Concepto creativo</p>
      <h1 className="mt-4 max-w-4xl font-[family-name:var(--font-display)] text-4xl italic leading-tight tracking-tight text-white md:text-5xl">
        {result.concept.conceptoCentral}
      </h1>
      <p className="mt-6 max-w-2xl text-sm leading-relaxed text-white/60">
        {result.concept.directionJustification}
      </p>
      <div className="mt-8 flex flex-wrap gap-2">
        {result.concept.moodKeywords.map((m) => (
          <span
            key={m}
            className="border border-white/[0.12] px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/70"
          >
            {m}
          </span>
        ))}
      </div>

      <div className="mt-20 grid grid-cols-1 gap-12 md:grid-cols-2">
        {result.images.images.map((img) => {
          const piece = result.copy.pieces.find((c) => c.format === img.format);
          const prompt = result.imagePrompts.prompts.find(
            (p) => p.format === img.format && p.variation === img.variation,
          );
          return (
            <PieceCard
              key={`${img.format}-${img.variation}`}
              imageUrl={img.url}
              isPlaceholder={img.isPlaceholder}
              format={img.format}
              variation={img.variation}
              width={img.width}
              height={img.height}
              headline={piece?.headline ?? ''}
              subhead={piece?.subhead ?? ''}
              body={piece?.body ?? ''}
              cta={piece?.cta ?? ''}
              prompt={prompt?.prompt ?? ''}
              negativePrompt={prompt?.negativePrompt ?? ''}
            />
          );
        })}
      </div>

      <DebugPanel data={data} result={result} />

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
    </section>
  );
}

function PieceCard(props: {
  imageUrl: string;
  isPlaceholder: boolean;
  format: string;
  variation: number;
  width: number;
  height: number;
  headline: string;
  subhead: string;
  body: string;
  cta: string;
  prompt: string;
  negativePrompt: string;
}) {
  return (
    <article className="group">
      <div
        className="relative w-full overflow-hidden border border-white/[0.08]"
        style={{ aspectRatio: `${props.width} / ${props.height}` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={props.imageUrl}
          alt={`${props.format} variación ${props.variation}`}
          className="h-full w-full object-cover"
        />
        {props.isPlaceholder ? (
          <span className="absolute right-2 top-2 border border-white/30 bg-black/60 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-white/70">
            placeholder
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-baseline justify-between text-xs">
        <span className="uppercase tracking-[0.2em] text-white/60">{props.format}</span>
        <span className="text-white/30">
          {props.width}×{props.height} · v{props.variation}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        <p className="font-[family-name:var(--font-display)] text-2xl leading-tight text-white">
          {props.headline}
        </p>
        {props.subhead ? <p className="text-sm text-white/70">{props.subhead}</p> : null}
        {props.body ? <p className="text-xs leading-relaxed text-white/50">{props.body}</p> : null}
        {props.cta ? (
          <p className="mt-3 inline-block bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/80">
            {props.cta}
          </p>
        ) : null}
      </div>

      <details className="mt-4 cursor-pointer text-[11px] text-white/40">
        <summary className="select-none uppercase tracking-[0.25em]">Image prompt</summary>
        <p className="mt-3 whitespace-pre-wrap leading-relaxed text-white/50">{props.prompt}</p>
        {props.negativePrompt ? (
          <p className="mt-3 whitespace-pre-wrap leading-relaxed text-white/30">
            <span className="uppercase tracking-[0.25em] text-white/40">Negative · </span>
            {props.negativePrompt}
          </p>
        ) : null}
      </details>
    </article>
  );
}

function DebugPanel({
  data,
  result,
}: {
  data: CampaignFormData;
  result: CampaignGeneration;
}) {
  const seconds = (result.meta.durationMs / 1000).toFixed(1);
  return (
    <details className="mt-20 cursor-pointer border-t border-white/[0.08] pt-8 text-xs text-white/50">
      <summary className="select-none uppercase tracking-[0.25em] text-white/60">
        Detalle técnico
      </summary>
      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2">
        <DebugBlock title="Brief refinado">
          <DebugLine label="Objetivo" value={result.brief.objetivo} />
          <DebugLine label="Audiencia" value={result.brief.audiencia} />
          <DebugLine label="Tono" value={result.brief.tono} />
          <DebugLine label="Ocasión" value={result.brief.ocasion} />
          <DebugLine label="CTA" value={result.brief.cta} />
          {result.brief.insightsAdicionales.length > 0 ? (
            <div className="mt-3">
              <p className="uppercase tracking-[0.25em] text-white/40">Insights</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-white/60">
                {result.brief.insightsAdicionales.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </DebugBlock>

        <DebugBlock title="Brand DNA">
          <DebugLine
            label="Paleta"
            value={`${result.brand.colorPalette.primary} · ${result.brand.colorPalette.secondary} · ${result.brand.colorPalette.accent}`}
          />
          <DebugLine
            label="Tipografía"
            value={`${result.brand.typography.headline} / ${result.brand.typography.body}`}
          />
          <DebugLine label="Estilo" value={result.brand.visualStyle.join(', ')} />
          <DebugLine label="Tono de voz" value={result.brand.toneKeywords.join(', ')} />
        </DebugBlock>

        <DebugBlock title="Concepto · paleta evolucionada">
          <DebugLine label="Base" value={result.concept.paleta.base} />
          <DebugLine label="Evolution" value={result.concept.paleta.evolution} />
          <DebugLine label="Accent" value={result.concept.paleta.accent} />
          <DebugLine label="Headline" value={result.concept.jerarquiaVisual.headline} />
          <DebugLine label="Subhead" value={result.concept.jerarquiaVisual.subhead} />
          <DebugLine label="CTA" value={result.concept.jerarquiaVisual.cta} />
        </DebugBlock>

        <DebugBlock title="Pipeline">
          <DebugLine label="Modelo" value={result.meta.model} />
          <DebugLine label="Duración" value={`${seconds}s`} />
          <DebugLine label="Generado" value={new Date(result.meta.generatedAt).toLocaleString()} />
          <DebugLine
            label="Stubs activos"
            value={result.meta.stubsUsed.length > 0 ? result.meta.stubsUsed.join(', ') : '(ninguno)'}
          />
          <DebugLine label="Formatos" value={data.output.formats.join(', ')} />
          <DebugLine label="Variaciones" value={String(data.output.variationsPerFormat)} />
        </DebugBlock>
      </div>
    </details>
  );
}

function DebugBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="uppercase tracking-[0.25em] text-white/60">{title}</p>
      <div className="space-y-2 text-xs leading-relaxed text-white/60">{children}</div>
    </div>
  );
}

function DebugLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-white/40">{label}: </span>
      <span className="text-white/70">{value}</span>
    </div>
  );
}
