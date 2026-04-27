// Brand Historian — agente 3 del pipeline.
//
// STUB hasta Fase 3 (Supabase con campañas históricas).
// Hoy todas las campañas son "primer contacto" porque no hay persistencia
// de marca. Devolvemos insights vacíos + marca isStub: true para que los
// agentes posteriores (Creative Director) sepan que no hay contexto histórico
// que respetar.
//
// Cuando llegue Supabase, esta función:
//   1. Consultará campañas anteriores de la marca
//   2. Llamará a Claude con esos datos como contexto
//   3. Devolverá insights reales (consistentElements, evolvingElements, etc.)

import type { BrandHistorianInsights } from '@/lib/agents/types';

export async function analyzeHistory(): Promise<{
  insights: BrandHistorianInsights;
  usage: { inputTokens: number; outputTokens: number; cacheReadInputTokens: number };
}> {
  const insights: BrandHistorianInsights = {
    brandEvolution: {
      consistentElements: [],
      evolvingElements: [],
      seasonalPatterns: [],
    },
    successfulConcepts: [],
    avoidPatterns: [],
    isStub: true,
  };
  return {
    insights,
    usage: { inputTokens: 0, outputTokens: 0, cacheReadInputTokens: 0 },
  };
}
