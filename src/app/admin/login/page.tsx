'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState, type FormEvent, type ReactNode } from 'react';
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

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <LoginShell>
          <p className="text-sm italic text-white/40">Cargando…</p>
        </LoginShell>
      }
    >
      <LoginShell>
        <LoginForm />
      </LoginShell>
    </Suspense>
  );
}

function LoginShell({ children }: { children: ReactNode }) {
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
          <p className="text-xs uppercase tracking-[0.25em] text-white/40">Admin · Login</p>
          <div className="text-xs text-white/40">&nbsp;</div>
        </div>
      </header>
      <section className="mx-auto flex min-h-[calc(100vh-65px)] max-w-md items-center px-6">
        {children}
      </section>
    </main>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') || '/admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || 'Error desconocido.');
      router.replace(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="w-full">
      <p className="text-xs uppercase tracking-[0.3em] text-white/40">Acceso restringido</p>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl italic leading-tight tracking-tight text-white">
        Panel de agentes
      </h1>
      <p className="mt-4 text-sm text-white/50">
        Solo administradores. Las credenciales se configuran via variables de entorno.
      </p>

      <div className="mt-12 space-y-6">
        <Field label="Usuario">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
            autoComplete="username"
            required
            className="w-full border border-white/[0.12] bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/[0.30] focus:outline-none"
            placeholder="admin"
          />
        </Field>

        <Field label="Contraseña">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full border border-white/[0.12] bg-transparent px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-white/[0.30] focus:outline-none"
            placeholder="••••••••"
          />
        </Field>
      </div>

      {error ? (
        <p className="mt-6 border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs text-red-200/80">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="mt-10 w-full bg-white px-6 py-3 text-sm text-black transition-colors hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? 'Verificando…' : 'Ingresar →'}
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[10px] uppercase tracking-[0.3em] text-white/50">
        {label}
      </span>
      {children}
    </label>
  );
}
