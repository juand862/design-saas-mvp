import Link from 'next/link';
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

const NAV_ITEMS = [
  { label: 'Mis Marcas', href: '/dashboard', active: true },
  { label: 'Campañas Recientes', href: '/dashboard/campaigns', active: false },
  { label: 'Admin · Agentes', href: '/admin/login', active: false },
  { label: 'Configuración', href: '/dashboard/settings', active: false },
  { label: 'Facturación', href: '/dashboard/billing', active: false },
];

export default function DashboardPage() {
  // Empty state para MVP. Más adelante: hook a Supabase.
  const marcas: { id: string; name: string; campaignCount: number; lastActivity: string }[] = [];
  const campañasRecientes: { id: string; name: string; brand: string; date: string }[] = [];

  return (
    <main
      className={`${display.variable} ${sans.variable} min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans antialiased`}
    >
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="border-b border-white/[0.08] lg:border-b-0 lg:border-r">
          <div className="sticky top-0 p-6 lg:p-8">
            <Link href="/" className="block">
              <span className="text-sm tracking-[0.2em] text-white transition-colors hover:text-white/70">
                CANVAS
              </span>
              <span className="mt-1 block text-[10px] tracking-[0.2em] text-white/30">
                DASHBOARD
              </span>
            </Link>

            <nav className="mt-12 space-y-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`block py-2 text-sm transition-colors ${
                    item.active
                      ? 'border-l-2 border-white pl-3 text-white'
                      : 'border-l-2 border-transparent pl-3 text-white/50 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-12 border-t border-white/[0.08] pt-6">
              <p className="mb-4 text-[10px] uppercase tracking-[0.3em] text-white/30">
                Acciones rápidas
              </p>
              <div className="space-y-2">
                <Link
                  href="/quick-campaign"
                  className="block w-full bg-white px-4 py-2.5 text-center text-xs text-black transition-colors hover:bg-white/90"
                >
                  + Nueva Campaña
                </Link>
                <button
                  type="button"
                  className="block w-full border border-white/[0.12] px-4 py-2.5 text-center text-xs text-white transition-colors hover:border-white/30 hover:bg-white/[0.02]"
                >
                  + Nueva Marca
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <section className="px-6 py-12 lg:px-12 lg:py-16">
          {/* Header */}
          <div className="mb-16">
            <p className="text-xs uppercase tracking-[0.3em] text-white/40">Vista general</p>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-5xl leading-tight tracking-tight text-white md:text-6xl">
              Mis Marcas
            </h1>
          </div>

          {/* Brands Grid */}
          {marcas.length === 0 ? (
            <div className="border border-dashed border-white/[0.12] bg-white/[0.01] p-16 text-center">
              <p className="font-[family-name:var(--font-display)] text-3xl italic text-white/30">
                Sin marcas todavía
              </p>
              <p className="mx-auto mt-4 max-w-md text-sm text-white/50">
                Crea tu primera marca para guardar guidelines, mantener coherencia entre
                campañas y construir memoria histórica.
              </p>
              <button
                type="button"
                className="mt-8 bg-white px-6 py-3 text-sm text-black transition-colors hover:bg-white/90"
              >
                + Crear primera marca
              </button>
              <p className="mt-6 text-xs text-white/30">
                ¿Solo necesitas una pieza rápida?{' '}
                <Link href="/quick-campaign" className="text-white/60 underline-offset-4 hover:underline">
                  Saltar a Campaña Rápida →
                </Link>
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-px bg-white/[0.08] md:grid-cols-2 lg:grid-cols-3">
              {marcas.map((marca) => (
                <article
                  key={marca.id}
                  className="cursor-pointer bg-[#0A0A0A] p-8 transition-colors hover:bg-white/[0.02]"
                >
                  <h3 className="font-[family-name:var(--font-display)] text-2xl text-white">
                    {marca.name}
                  </h3>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-white/40">
                    {marca.campaignCount} campañas · {marca.lastActivity}
                  </p>
                </article>
              ))}
            </div>
          )}

          {/* Campañas Recientes */}
          <div className="mt-24">
            <div className="mb-8 flex items-end justify-between border-b border-white/[0.08] pb-4">
              <h2 className="font-[family-name:var(--font-display)] text-3xl text-white">
                Campañas recientes
              </h2>
              <Link
                href="/dashboard/campaigns"
                className="text-xs uppercase tracking-[0.2em] text-white/50 transition-colors hover:text-white"
              >
                Ver todas →
              </Link>
            </div>
            {campañasRecientes.length === 0 ? (
              <p className="py-8 text-sm text-white/40">
                Las campañas que generes aparecerán aquí, agrupadas por marca.
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.08]">
                {campañasRecientes.map((c) => (
                  <li key={c.id} className="flex items-center justify-between py-4">
                    <div>
                      <p className="text-white">{c.name}</p>
                      <p className="text-xs text-white/40">{c.brand}</p>
                    </div>
                    <span className="text-xs text-white/40">{c.date}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
