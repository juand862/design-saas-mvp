import Link from 'next/link';
import { Instrument_Serif, Geist } from 'next/font/google';

// NOTA: idealmente mueve estas fonts a src/app/layout.tsx para no duplicar
// en cada página. Aquí van locales para que el archivo sea autocontenido.
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

const DIFERENCIADORES = [
  { n: '01', t: 'Control', d: 'Iteraciones directas, no cajas negras. Tú diriges cada refinamiento.' },
  { n: '02', t: 'Coherencia', d: 'Una campaña, N formatos coherentes entre sí.' },
  { n: '03', t: 'Calidad', d: 'Piezas usables, profesionales. Sin "AI slop".' },
  { n: '04', t: 'Velocidad', d: 'Del brief al primer batch en minutos, no semanas.' },
  { n: '05', t: 'Memoria', d: 'Análisis de campañas anteriores para evolución coherente.' },
];

export default function LandingPage() {
  return (
    <main
      className={`${display.variable} ${sans.variable} min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans antialiased`}
    >
      {/* Top Bar */}
      <header className="border-b border-white/[0.08]">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="text-sm tracking-[0.2em] text-white">CANVAS</span>
            <span className="text-[10px] tracking-[0.2em] text-white/30">／ DESIGN SAAS</span>
          </div>
          <nav className="hidden items-center gap-8 text-sm text-white/50 md:flex">
            <a href="#diferenciadores" className="transition-colors hover:text-white">
              Producto
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Precios
            </a>
            <Link href="/admin/login" className="transition-colors hover:text-white">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pt-24 pb-32 md:pt-32 md:pb-40">
          <div className="max-w-4xl">
            <p className="mb-8 text-xs uppercase tracking-[0.3em] text-white/40">
              Plataforma agéntica · Diseño multicanal
            </p>
            <h1
              className="font-[family-name:var(--font-display)] text-[clamp(3rem,8vw,7rem)] leading-[0.95] tracking-tight text-white"
            >
              Del brief al
              <br />
              <span className="italic text-white/70">batch coherente</span>
              <br />
              en minutos.
            </h1>
            <p className="mt-10 max-w-2xl text-lg leading-relaxed text-white/60">
              Un sistema de agentes especializados convierte tu brief en piezas listas para
              múltiples canales — respetando identidad, formatos y jerarquías. Sin caja negra:
              tú diriges cada iteración.
            </p>

            {/* Dual CTAs */}
            <div className="mt-14 flex flex-col gap-4 sm:flex-row sm:items-stretch">
              <Link
                href="/quick-campaign"
                className="group relative flex flex-1 items-center justify-between gap-6 bg-white px-8 py-6 text-black transition-all hover:bg-white/90 sm:max-w-md"
              >
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-black/50">
                    Inmediato
                  </p>
                  <p className="mt-1 text-xl font-medium">Campaña Rápida</p>
                  <p className="mt-1 text-sm text-black/60">
                    Brief → assets sin configurar marca
                  </p>
                </div>
                <span className="text-2xl transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <Link
                href="/dashboard"
                className="group relative flex flex-1 items-center justify-between gap-6 border border-white/[0.12] px-8 py-6 transition-all hover:border-white/30 hover:bg-white/[0.02] sm:max-w-md"
              >
                <div className="text-left">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-white/40">
                    Para equipos
                  </p>
                  <p className="mt-1 text-xl font-medium">Setup Completo</p>
                  <p className="mt-1 text-sm text-white/50">
                    Marcas, guidelines y memoria histórica
                  </p>
                </div>
                <span className="text-2xl transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>

        {/* Grid decorativo sutil */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </section>

      {/* Diferenciadores */}
      <section id="diferenciadores" className="border-t border-white/[0.08]">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="mb-16 text-xs uppercase tracking-[0.3em] text-white/40">
            Cinco principios
          </p>
          <div className="grid grid-cols-1 gap-px bg-white/[0.08] md:grid-cols-5">
            {DIFERENCIADORES.map((item) => (
              <div key={item.n} className="bg-[#0A0A0A] p-8">
                <p className="font-[family-name:var(--font-display)] text-3xl italic text-white/30">
                  {item.n}
                </p>
                <h3 className="mt-6 text-lg text-white">{item.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/50">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.08]">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex items-center justify-between text-xs text-white/40">
            <p>© 2026 Canvas SaaS</p>
            <p className="tracking-[0.2em]">DESIGN MULTICANAL</p>
          </div>
        </div>
      </footer>
    </main>
  );
}
