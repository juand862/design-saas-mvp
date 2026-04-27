// POST /api/agents/brand-historian
// Body: {} (sin inputs hoy — stub)
// Response: { ok: true, data: BrandHistorianInsights, meta: { durationMs, usage } }

import { NextResponse } from 'next/server';
import { analyzeHistory } from '@/lib/agents/brand-historian';

export const runtime = 'nodejs';

export async function POST() {
  const start = Date.now();
  try {
    const { insights, usage } = await analyzeHistory();
    return NextResponse.json({
      ok: true,
      data: insights,
      meta: { durationMs: Date.now() - start, usage },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido.';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
