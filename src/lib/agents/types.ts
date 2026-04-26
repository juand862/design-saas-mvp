// Tipos de output del pipeline de agentes (Fase 2A — texto puro).
// Cada agente expone su shape de output. La ruta orquestadora compone todo
// en `CampaignGeneration`.

import type { CampaignFormData, QuickCampaignFormat } from '@/lib/types';

// 1. Brief Analyst ----------------------------------------------------------

export interface BriefAnalysis {
  objetivo: string;
  audiencia: string;
  tono: string;
  ocasion: string;
  cta: string;
  restricciones: string[];
  insightsAdicionales: string[];
}

// 2. Brand Analyzer ---------------------------------------------------------

export interface BrandDNA {
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: {
    headline: string;
    body: string;
  };
  visualStyle: string[];
  toneKeywords: string[];
}

// 4. Creative Director ------------------------------------------------------

export interface CreativeConcept {
  conceptoCentral: string;
  directionJustification: string;
  paleta: {
    base: string;
    evolution: string;
    accent: string;
  };
  moodKeywords: string[];
  jerarquiaVisual: {
    headline: string;
    subhead: string;
    cta: string;
  };
}

// 5. Copywriter -------------------------------------------------------------

export interface FormatCopy {
  format: QuickCampaignFormat;
  headline: string;
  subhead: string;
  body: string;
  cta: string;
}

export interface CopyByFormat {
  pieces: FormatCopy[];
}

// 6. Art Director -----------------------------------------------------------

export interface FormatImagePrompt {
  format: QuickCampaignFormat;
  variation: number;
  prompt: string;
  negativePrompt: string;
}

export interface ImagePrompts {
  prompts: FormatImagePrompt[];
}

// Composite ------------------------------------------------------------------

export interface CampaignGeneration {
  input: CampaignFormData;
  brief: BriefAnalysis;
  brand: BrandDNA;
  concept: CreativeConcept;
  copy: CopyByFormat;
  imagePrompts: ImagePrompts;
  meta: {
    durationMs: number;
    model: string;
    generatedAt: string;
  };
}

// Helpers genéricos ---------------------------------------------------------

export type AgentSuccess<T> = { ok: true; data: T };
export type AgentFailure = { ok: false; error: string };
export type AgentResult<T> = AgentSuccess<T> | AgentFailure;
