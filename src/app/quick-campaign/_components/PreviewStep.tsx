'use client';

import { CampaignFormData, QUICK_CAMPAIGN_FORMATS } from '@/lib/types';
import { ValidationIssue } from './validation';

const STEP_LABELS: Record<1 | 4, string> = {
  1: 'Brief',
  4: 'Output',
};

export function PreviewStep({
  data,
  issues,
  onJumpTo,
}: {
  data: CampaignFormData;
  issues: ValidationIssue[];
  onJumpTo: (step: number) => void;
}) {
  const selectedFormats = QUICK_CAMPAIGN_FORMATS.filter((f) =>
    data.output.formats.includes(f.id),
  );

  return (
    <div className="space-y-12">
      {issues.length > 0 ? (
        <div className="border border-white/[0.18] bg-white/[0.02] p-6">
          <p className="font-[family-name:var(--font-display)] text-2xl italic text-white">
            Casi.
          </p>
          <p className="mt-2 text-sm text-white/60">
            Antes de generar la campaña, repasa lo siguiente:
          </p>
          <ul className="mt-4 space-y-2">
            {issues.map((issue) => (
              <li key={issue.field} className="flex items-baseline justify-between gap-4">
                <span className="text-sm text-white">{issue.message}</span>
                <button
                  type="button"
                  onClick={() => onJumpTo(issue.jumpToStep)}
                  className="text-xs uppercase tracking-[0.2em] text-white/60 transition-colors hover:text-white"
                >
                  Ir a {STEP_LABELS[issue.jumpToStep]} →
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <Section title="Brief" onEdit={() => onJumpTo(1)}>
        <Row label="Tipo" value={data.brief.campaignType} />
        <Row label="Objetivo" value={data.brief.objetivo || '—'} />
        <Row label="Audiencia" value={data.brief.audiencia || '—'} />
        <Row label="Tono" value={data.brief.tono || '—'} />
        <Row label="Ocasión" value={data.brief.ocasion || '—'} />
        <Row label="CTA" value={data.brief.cta || '—'} />
        {data.brief.restricciones.length > 0 ? (
          <Row label="Restricciones" value={data.brief.restricciones.join(' · ')} />
        ) : null}
      </Section>

      <Section title="Marca" onEdit={() => onJumpTo(2)}>
        <Row
          label="Paleta"
          value={
            <div className="flex items-center gap-3">
              {(['primary', 'secondary', 'accent'] as const).map((k) => (
                <div key={k} className="flex items-center gap-2">
                  <span
                    className="inline-block h-4 w-4 border border-white/20"
                    style={{ backgroundColor: data.brand.colors[k] }}
                  />
                  <span className="font-[family-name:var(--font-display)] italic text-white/60">
                    {data.brand.colors[k]}
                  </span>
                </div>
              ))}
            </div>
          }
        />
        <Row
          label="Tipografía"
          value={`${data.brand.typography.headline} / ${data.brand.typography.body}`}
        />
        <Row
          label="Estilo"
          value={data.brand.style.length > 0 ? data.brand.style.join(' · ') : '—'}
        />
      </Section>

      <Section title="Referencias" onEdit={() => onJumpTo(3)}>
        <Row
          label="URLs"
          value={data.references.urls.length > 0 ? `${data.references.urls.length} ítem(s)` : '—'}
        />
        <Row
          label="Keywords"
          value={
            data.references.keywords.length > 0
              ? data.references.keywords.join(' · ')
              : '—'
          }
        />
      </Section>

      <Section title="Output" onEdit={() => onJumpTo(4)}>
        <Row
          label="Formatos"
          value={
            selectedFormats.length > 0 ? selectedFormats.map((f) => f.label).join(' · ') : '—'
          }
        />
        <Row
          label="Variaciones"
          value={`${data.output.variationsPerFormat} por formato`}
        />
        <Row
          label="Total"
          value={`${selectedFormats.length * data.output.variationsPerFormat} pieza(s)`}
        />
      </Section>
    </div>
  );
}

function Section({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-6 flex items-baseline justify-between border-b border-white/[0.08] pb-3">
        <h2 className="font-[family-name:var(--font-display)] text-2xl italic text-white">
          {title}
        </h2>
        <button
          type="button"
          onClick={onEdit}
          className="text-xs uppercase tracking-[0.2em] text-white/40 transition-colors hover:text-white"
        >
          Editar →
        </button>
      </div>
      <dl className="space-y-3">{children}</dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-baseline gap-4 text-sm">
      <dt className="text-[10px] uppercase tracking-[0.25em] text-white/40">{label}</dt>
      <dd className="text-white/80">{value}</dd>
    </div>
  );
}
