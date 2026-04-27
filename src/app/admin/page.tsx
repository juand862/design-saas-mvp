'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Instrument_Serif, Geist } from 'next/font/google';
import type { AgentConfig } from '@/lib/agents/registry';

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

export default function AdminDashboardPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentConfig[] | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/admin/agents');
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok) throw new Error(json.error || 'Error al cargar agentes.');
        setAgents(json.data);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Error desconocido.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.replace('/admin/login');
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
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Admin · Agentes</p>
          <div className="flex items-center gap-6">
            <Link
              href="/admin/tokens"
              className="text-xs uppercase tracking-[0.25em] text-white/60 transition-colors hover:text-white"
            >
              Tokens →
            </Link>
            <button
              type="button"
              onClick={onLogout}
              className="text-xs uppercase tracking-[0.25em] text-white/60 transition-colors hover:text-white"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Pipeline</p>
        <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-display)] text-4xl italic leading-tight tracking-tight text-white md:text-5xl">
          Configuración de agentes
        </h1>
        <p className="mt-6 max-w-2xl text-sm text-white/50">
          Edita el system prompt y los parámetros de cada agente. Los cambios viven en memoria
          y se pierden al reiniciar el server. Persistencia real llega con Supabase en Fase 3.
          Las API keys de Anthropic y Replicate se gestionan en{' '}
          <Link href="/admin/tokens" className="text-white underline hover:text-white/80">
            /admin/tokens
          </Link>
          .
        </p>

        {error ? (
          <p className="mt-12 max-w-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-200/80">
            {error}
          </p>
        ) : null}

        {!agents && !error ? (
          <p className="mt-16 text-sm italic text-white/40">Cargando…</p>
        ) : null}

        {agents ? (
          <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function AgentCard({ agent }: { agent: AgentConfig }) {
  return (
    <Link
      href={`/admin/${agent.id}`}
      className="group block border border-white/[0.08] p-6 transition-colors hover:border-white/[0.30]"
    >
      <div className="flex items-start justify-between">
        <span className="text-[10px] uppercase tracking-[0.3em] text-white/40">
          #{agent.order}
        </span>
        <KindBadge kind={agent.kind} />
      </div>

      <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl text-white">
        {agent.name}
      </h2>
      <p className="mt-2 text-xs leading-relaxed text-white/50">{agent.description}</p>

      <div className="mt-6 space-y-1 text-xs text-white/60">
        <Line label="ID" value={agent.id} mono />
        {agent.kind === 'llm' ? (
          <>
            <Line label="Modelo" value={agent.model} mono />
            <Line label="Temp." value={agent.temperature.toFixed(2)} />
            <Line label="Max tokens" value={agent.maxTokens.toString()} />
          </>
        ) : agent.kind === 'image' ? (
          <Line label="Modelo" value={agent.imageModel ?? '—'} mono />
        ) : (
          <Line label="Modelo" value="—" />
        )}
      </div>

      <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-white/30 group-hover:text-white/60">
        Editar →
      </p>
    </Link>
  );
}

function KindBadge({ kind }: { kind: AgentConfig['kind'] }) {
  const meta = (() => {
    switch (kind) {
      case 'llm':
        return { label: 'llm', cls: 'border-emerald-500/30 text-emerald-200/70' };
      case 'image':
        return { label: 'image', cls: 'border-sky-500/30 text-sky-200/70' };
      case 'stub':
        return { label: 'stub', cls: 'border-amber-500/30 text-amber-200/70' };
    }
  })();
  return (
    <span className={`border px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] ${meta.cls}`}>
      {meta.label}
    </span>
  );
}

function Line({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-white/40">{label}</span>
      <span className={mono ? 'font-mono text-white/80' : 'text-white/80'}>{value}</span>
    </div>
  );
}
