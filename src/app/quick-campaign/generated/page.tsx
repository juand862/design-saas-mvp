'use client';

import Link from 'next/link';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Instrument_Serif, Geist } from 'next/font/google';
import {
  CampaignFormData,
  QUICK_CAMPAIGN_FORMATS,
  QUICK_CAMPAIGN_STORAGE_KEY,
} from '@/lib/types';
import { clearSessionValue, useSessionValue } from '@/lib/session-storage';

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

type MockAsset = {
  key: string;
  formatId: string;
  formatLabel: string;
  width: number;
  height: number;
  variation: number;
};

export default function GeneratedPage() {
  const router = useRouter();
  const data = useSessionValue<CampaignFormData>(QUICK_CAMPAIGN_STORAGE_KEY);

  useEffect(() => {
    if (data) return;
    const id = window.setTimeout(() => router.replace('/quick-campaign'), 50);
    return () => window.clearTimeout(id);
  }, [data, router]);

  const assets = useMemo<MockAsset[]>(() => {
    if (!data) return [];
    const selected = QUICK_CAMPAIGN_FORMATS.filter((f) =>
      data.output.formats.includes(f.id),
    );
    const result: MockAsset[] = [];
    for (const fmt of selected) {
      for (let v = 1; v <= data.output.variationsPerFormat; v++) {
        result.push({
          key: `${fmt.id}-${v}`,
          formatId: fmt.id,
          formatLabel: fmt.label,
          width: fmt.width,
          height: fmt.height,
          variation: v,
        });
      }
    }
    return result;
  }, [data]);

  const handleNueva = () => {
    clearSessionValue(QUICK_CAMPAIGN_STORAGE_KEY);
    router.push('/quick-campaign');
  };

  if (!data) {
    return (
      <main
        className={`${display.variable} ${sans.variable} min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans antialiased`}
      >
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-6">
          <p className="font-[family-name:var(--font-display)] text-2xl italic text-white/40">
            Recuperando campaña...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`${display.variable} ${sans.variable} min-h-screen bg-[#0A0A0A] text-[#F5F5F5] font-sans antialiased`}
    >
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
          <div className="text-xs text-white/40">{assets.length} pieza(s)</div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">Resultado</p>
        <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-display)] text-5xl leading-tight tracking-tight text-white md:text-6xl">
          {data.brief.objetivo || (
            <span className="italic text-white/40">Sin objetivo definido</span>
          )}
        </h1>
        <p className="mt-4 max-w-xl text-sm text-white/50">
          Mock visual de Fase 1. Las piezas reales se renderizan con el Layout Composer en
          Fase 2.
        </p>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => (
            <MockCard key={asset.key} asset={asset} data={data} />
          ))}
        </div>

        <div className="mt-20 flex flex-col items-center gap-4 border-t border-white/[0.08] pt-8 sm:flex-row sm:justify-between">
          <Link
            href="/quick-campaign"
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            ← Volver a editar
          </Link>
          <button
            type="button"
            onClick={handleNueva}
            className="bg-white px-6 py-3 text-sm text-black transition-colors hover:bg-white/90"
          >
            Nueva campaña →
          </button>
        </div>
      </section>
    </main>
  );
}

function MockCard({ asset, data }: { asset: MockAsset; data: CampaignFormData }) {
  const aspect = `${asset.width} / ${asset.height}`;
  const { primary, secondary, accent } = data.brand.colors;
  const headlineFont = data.brand.typography.headline;

  return (
    <article className="group">
      <div
        className="relative w-full overflow-hidden border border-white/[0.08]"
        style={{
          aspectRatio: aspect,
          backgroundColor: primary,
          color: secondary,
        }}
      >
        <div
          className="absolute"
          style={{
            top: `${10 + asset.variation * 6}%`,
            left: '8%',
            right: '8%',
            bottom: '20%',
          }}
        >
          <p
            className="text-[10px] uppercase tracking-[0.3em]"
            style={{ color: secondary, opacity: 0.6 }}
          >
            {data.brief.campaignType}
          </p>
          <p
            className="mt-3 text-[clamp(1.5rem,4vw,2.5rem)] leading-[1.05]"
            style={{
              fontFamily: `'${headlineFont}', serif`,
              color: secondary,
            }}
          >
            {truncate(data.brief.objetivo || 'Tu titular aquí', 80)}
          </p>
          {data.brief.cta ? (
            <p
              className="mt-6 inline-block px-4 py-2 text-xs uppercase tracking-[0.2em]"
              style={{ backgroundColor: accent, color: primary }}
            >
              {truncate(data.brief.cta, 32)}
            </p>
          ) : null}
        </div>

        <div
          className="absolute"
          style={{
            bottom: '8%',
            left: '8%',
            right: '8%',
            height: '4px',
            backgroundColor: accent,
            transform: `translateX(${(asset.variation - 1) * 8}%)`,
          }}
        />
      </div>

      <div className="mt-3 flex items-baseline justify-between text-xs">
        <span className="uppercase tracking-[0.2em] text-white/60">{asset.formatLabel}</span>
        <span className="text-white/30">
          {asset.width}×{asset.height} · v{asset.variation}
        </span>
      </div>
    </article>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
