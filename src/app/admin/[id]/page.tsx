'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, type FormEvent } from 'react';
import { Instrument_Serif, Geist } from 'next/font/google';
import type { AgentConfig } from '@/lib/agents/registry';
import { MODELS, type ModelId } from '@/lib/agents/anthropic';

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

const MODEL_OPTIONS: { value: ModelId; label: string }[] = [
  { value: MODELS.sonnet, label: 'Sonnet 4.6 (default)' },
  { value: MODELS.opus, label: 'Opus 4.7' },
  { value: MODELS.haiku, label: 'Haiku 4.5' },
];

export default function AdminAgentEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id;

  const [agent, setAgent] = useState<AgentConfig | undefined>(undefined);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [model, setModel] = useState<ModelId>(MODELS.sonnet);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);

  const [loadError, setLoadError] = useState<string | undefined>(undefined);
  const [saveError, setSaveError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | undefined>(undefined);

  const applyAgent = (next: AgentConfig) => {
    setAgent(next);
    setSystemPrompt(next.systemPrompt);
    setModel(next.model);
    setTemperature(next.temperature);
    setMaxTokens(next.maxTokens);
  };

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/admin/agents/${id}`);
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok) throw new Error(json.error || 'Error al cargar.');
        applyAgent(json.data);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : 'Error desconocido.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!agent || agent.kind !== 'llm') return;
    setSaving(true);
    setSaveError(undefined);
    try {
      const res = await fetch(`/api/admin/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt, model, temperature, maxTokens }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Error al guardar.');
      applyAgent(json.data);
      setSavedAt(Date.now());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error desconocido.');
    } finally {
      setSaving(false);
    }
  };

  const onReset = async () => {
    if (!agent || agent.kind !== 'llm') return;
    if (!window.confirm('¿Restaurar valores por defecto? Los cambios actuales se pierden.')) {
      return;
    }
    setSaving(true);
    setSaveError(undefined);
    try {
      const res = await fetch(`/api/admin/agents/${agent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset: true }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Error al restaurar.');
      applyAgent(json.data);
      setSavedAt(Date.now());
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error desconocido.');
    } finally {
      setSaving(false);
    }
  };

  if (loadError) {
    return (
      <Shell>
        <Header>
          <button
            type="button"
            onClick={() => router.push('/admin')}
            className="text-xs uppercase tracking-[0.25em] text-white/60 hover:text-white"
          >
            ← Volver
          </button>
        </Header>
        <section className="mx-auto max-w-3xl px-6 py-24">
          <p className="text-xs uppercase tracking-[0.3em] text-red-400/70">Error</p>
          <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-white">
            No se pudo cargar el agente.
          </h1>
          <p className="mt-6 text-xs text-red-200/80">{loadError}</p>
        </section>
      </Shell>
    );
  }

  if (!agent) {
    return (
      <Shell>
        <Header>
          <span className="text-xs text-white/40">&nbsp;</span>
        </Header>
        <section className="mx-auto max-w-3xl px-6 py-24">
          <p className="text-sm italic text-white/40">Cargando…</p>
        </section>
      </Shell>
    );
  }

  const isStub = agent.kind === 'stub';

  return (
    <Shell>
      <Header>
        <Link
          href="/admin"
          className="text-xs uppercase tracking-[0.25em] text-white/60 hover:text-white"
        >
          ← Agentes
        </Link>
      </Header>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">
              Agente #{agent.order}
            </p>
            <h1 className="mt-3 font-[family-name:var(--font-display)] text-4xl italic leading-tight tracking-tight text-white md:text-5xl">
              {agent.name}
            </h1>
          </div>
          <span
            className={`border px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] ${
              isStub
                ? 'border-amber-500/30 text-amber-200/70'
                : 'border-emerald-500/30 text-emerald-200/70'
            }`}
          >
            {agent.kind}
          </span>
        </div>

        <p className="mt-4 max-w-2xl text-sm text-white/60">{agent.description}</p>

        <dl className="mt-8 grid grid-cols-2 gap-x-8 gap-y-2 text-xs md:max-w-md">
          <dt className="text-white/40">ID</dt>
          <dd className="font-mono text-white/80">{agent.id}</dd>
        </dl>

        {isStub ? (
          <div className="mt-12 border border-amber-500/20 bg-amber-500/5 p-6 text-sm text-amber-100/70">
            Este agente es un stub y no es editable hasta que se conecte la integración real
            (Replicate para Image Generator, Supabase para Brand Historian).
          </div>
        ) : (
          <form onSubmit={onSave} className="mt-12 space-y-8">
            <Field label="System prompt" hint="El cuerpo del prompt principal. JSON-only en la salida.">
              <textarea
                value={systemPrompt}
                onChange={(e) => setSystemPrompt(e.target.value)}
                rows={20}
                required
                className="w-full resize-y border border-white/[0.12] bg-transparent px-4 py-3 font-mono text-xs leading-relaxed text-white placeholder:text-white/30 focus:border-white/[0.30] focus:outline-none"
              />
            </Field>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Field label="Modelo">
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value as ModelId)}
                  className="w-full appearance-none border border-white/[0.12] bg-[#0A0A0A] px-4 py-3 text-sm text-white focus:border-white/[0.30] focus:outline-none"
                >
                  {MODEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Temperatura" hint="0.0 — determinista · 1.0 — creativo">
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={temperature}
                  onChange={(e) => setTemperature(Number(e.target.value))}
                  className="w-full border border-white/[0.12] bg-transparent px-4 py-3 text-sm text-white focus:border-white/[0.30] focus:outline-none"
                />
              </Field>

              <Field label="Max tokens" hint="Tope de tokens de respuesta">
                <input
                  type="number"
                  min={1}
                  max={8192}
                  step={1}
                  value={maxTokens}
                  onChange={(e) => setMaxTokens(Number(e.target.value))}
                  className="w-full border border-white/[0.12] bg-transparent px-4 py-3 text-sm text-white focus:border-white/[0.30] focus:outline-none"
                />
              </Field>
            </div>

            {saveError ? (
              <p className="border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-200/80">
                {saveError}
              </p>
            ) : null}

            {savedAt ? (
              <p className="text-xs text-emerald-200/70">
                Guardado · {new Date(savedAt).toLocaleTimeString()}
              </p>
            ) : null}

            <div className="flex flex-wrap gap-3 border-t border-white/[0.08] pt-8">
              <button
                type="submit"
                disabled={saving}
                className="bg-white px-6 py-3 text-sm text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                onClick={onReset}
                disabled={saving}
                className="border border-white/[0.12] px-6 py-3 text-sm text-white transition-colors hover:border-white/[0.30] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Restaurar default
              </button>
              <Link
                href="/admin"
                className="border border-transparent px-6 py-3 text-sm text-white/60 transition-colors hover:text-white"
              >
                Cancelar
              </Link>
            </div>
          </form>
        )}
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

function Header({ children }: { children: React.ReactNode }) {
  return (
    <header className="border-b border-white/[0.08]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link
          href="/"
          className="flex items-center gap-3 text-sm text-white/60 transition-colors hover:text-white"
        >
          <span className="text-base">←</span>
          <span className="tracking-[0.2em]">CANVAS</span>
        </Link>
        <p className="text-xs uppercase tracking-[0.25em] text-white/40">Admin · Editar</p>
        {children}
      </div>
    </header>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-white/50">
        {label}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-[10px] text-white/40">{hint}</span> : null}
    </label>
  );
}
