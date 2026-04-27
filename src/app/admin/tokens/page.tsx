'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Instrument_Serif, Geist } from 'next/font/google';
import type { TokenStatus } from '@/lib/admin/tokens';

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

type TokenName = 'anthropic' | 'replicate';
type StatusMap = Record<TokenName, TokenStatus>;

const TOKEN_LABELS: Record<TokenName, { label: string; description: string; envVar: string; getKeyAt: string }> = {
  anthropic: {
    label: 'Anthropic API Key',
    description: 'Usado por Brief Analyst, Brand Analyzer, Creative Director, Copywriter y Art Director.',
    envVar: 'ANTHROPIC_API_KEY',
    getKeyAt: 'https://console.anthropic.com/settings/keys',
  },
  replicate: {
    label: 'Replicate API Token',
    description: 'Usado por Image Generator (Flux / Ideogram).',
    envVar: 'REPLICATE_API_TOKEN',
    getKeyAt: 'https://replicate.com/account/api-tokens',
  },
};

export default function AdminTokensPage() {
  const [statuses, setStatuses] = useState<StatusMap | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | undefined>(undefined);

  const refresh = async () => {
    try {
      const res = await fetch('/api/admin/tokens');
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Error al cargar.');
      setStatuses(json.data);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Error desconocido.');
    }
  };

  // Carga inicial — fetch tokens al montar. setState dentro del effect es
  // intencional (sincronizamos con un endpoint async).
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    refresh();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

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
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Admin · Tokens</p>
          <Link
            href="/admin"
            className="text-xs uppercase tracking-[0.25em] text-white/60 transition-colors hover:text-white"
          >
            Agentes →
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Credenciales</p>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl italic leading-tight tracking-tight text-white md:text-5xl">
          API Tokens
        </h1>
        <p className="mt-6 max-w-2xl text-sm text-white/50">
          Los tokens se cargan al arrancar el server desde las variables de entorno. Los cambios
          que hagas acá viven en memoria mientras el server esté corriendo — restart vuelve a los
          valores de <code className="font-mono text-white/70">.env.local</code>.
        </p>

        {loadError ? (
          <p className="mt-12 border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-200/80">
            {loadError}
          </p>
        ) : null}

        {!statuses && !loadError ? <p className="mt-12 text-sm italic text-white/40">Cargando…</p> : null}

        {statuses ? (
          <div className="mt-12 space-y-12">
            {(Object.keys(TOKEN_LABELS) as TokenName[]).map((name) => (
              <TokenSection
                key={name}
                name={name}
                status={statuses[name]}
                onRefresh={refresh}
              />
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}

function TokenSection({
  name,
  status,
  onRefresh,
}: {
  name: TokenName;
  status: TokenStatus;
  onRefresh: () => void;
}) {
  const meta = TOKEN_LABELS[name];
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [savedAt, setSavedAt] = useState<number | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch('/api/admin/tokens', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value: value.trim() }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Error al guardar.');
      setValue('');
      setSavedAt(Date.now());
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido.');
    } finally {
      setBusy(false);
    }
  };

  const onReset = async () => {
    if (!window.confirm(`¿Restaurar al valor de ${meta.envVar} en .env.local?`)) return;
    setBusy(true);
    setError(undefined);
    try {
      const res = await fetch('/api/admin/tokens', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, value: null }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Error al restaurar.');
      setSavedAt(Date.now());
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="border border-white/[0.08] p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-2xl text-white">
            {meta.label}
          </h2>
          <p className="mt-2 text-xs text-white/50">{meta.description}</p>
        </div>
        <SourceBadge source={status.source} configured={status.configured} />
      </div>

      <dl className="mt-6 grid grid-cols-[120px_1fr] gap-y-2 text-xs">
        <Dt>Estado</Dt>
        <Dd>{status.configured ? 'configurado' : '(no configurado)'}</Dd>
        <Dt>Valor</Dt>
        <Dd className="font-mono">{status.masked}</Dd>
        <Dt>Env var</Dt>
        <Dd className="font-mono text-white/50">{meta.envVar}</Dd>
        <Dt>Obtener</Dt>
        <Dd>
          <a
            href={meta.getKeyAt}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/70 underline hover:text-white"
          >
            {meta.getKeyAt}
          </a>
        </Dd>
      </dl>

      <form onSubmit={onSave} className="mt-8 space-y-3">
        <label className="block">
          <span className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-white/50">
            Nuevo valor (sobreescribe en memoria)
          </span>
          <input
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            className="w-full border border-white/[0.12] bg-transparent px-4 py-3 font-mono text-xs text-white placeholder:text-white/30 focus:border-white/[0.30] focus:outline-none"
            placeholder={name === 'anthropic' ? 'sk-ant-...' : 'r8_...'}
          />
        </label>

        {error ? (
          <p className="border border-red-500/20 bg-red-500/5 px-4 py-2 text-xs text-red-200/80">
            {error}
          </p>
        ) : null}
        {savedAt ? (
          <p className="text-xs text-emerald-200/70">
            Aplicado · {new Date(savedAt).toLocaleTimeString()}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="submit"
            disabled={busy || !value.trim()}
            className="bg-white px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Guardando…' : 'Guardar override'}
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={busy || status.source !== 'override'}
            className="border border-white/[0.12] px-5 py-2.5 text-xs uppercase tracking-[0.2em] text-white transition-colors hover:border-white/[0.30] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Restaurar a env
          </button>
        </div>
      </form>
    </article>
  );
}

function SourceBadge({ source, configured }: { source: TokenStatus['source']; configured: boolean }) {
  if (!configured) {
    return (
      <span className="border border-red-500/30 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-red-200/70">
        sin configurar
      </span>
    );
  }
  if (source === 'override') {
    return (
      <span className="border border-amber-500/30 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-amber-200/70">
        override · memoria
      </span>
    );
  }
  return (
    <span className="border border-emerald-500/30 px-2 py-0.5 text-[9px] uppercase tracking-[0.2em] text-emerald-200/70">
      desde env
    </span>
  );
}

function Dt({ children }: { children: ReactNode }) {
  return <dt className="text-white/40">{children}</dt>;
}

function Dd({ children, className }: { children: ReactNode; className?: string }) {
  return <dd className={`text-white/80 ${className ?? ''}`}>{children}</dd>;
}
