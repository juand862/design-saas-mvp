// Tipos para el formulario de diseño multicanal

export interface BrandGuidelines {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  typography: {
    headline: string;
    body: string;
  };
  logo: File | null;
  logoAlt: File | null; // Logo alternativo
  style: string[]; // ['minimal', 'bold', 'vintage', etc.]
}

export interface VisualReference {
  file: File;
  description: string;
  id: string;
}

export interface OutputSpecs {
  formats: string[]; // ['instagram-feed', 'instagram-story', 'facebook-post', etc.]
  variationsPerFormat: number;
  customDimensions?: {
    width: number;
    height: number;
    name: string;
  }[];
}

export interface DesignRequest {
  brief: string;
  campaignType: 'promotional' | 'branding' | 'launch' | 'seasonal';
  brandGuidelines: BrandGuidelines;
  visualReferences: VisualReference[];
  outputSpecs: OutputSpecs;
}

export interface GeneratedDesign {
  format: string;
  url: string;
  dimensions: { width: number; height: number };
  variation: number;
}

export interface GenerationResult {
  success: boolean;
  designs: GeneratedDesign[];
  processingTime: number;
  estimatedCost: number;
  error?: string;
}

// Estados del formulario progresivo
export type FormStep = 'brief' | 'brand' | 'references' | 'output' | 'preview';

export interface FormState {
  currentStep: FormStep;
  isValid: boolean;
  isGenerating: boolean;
}

// ---------------------------------------------------------------------------
// Quick Campaign (flujo /quick-campaign — sin marca persistente, sin uploads).
// Coexiste con DesignRequest hasta que el wizard de marca de /dashboard
// consolide el modelo en una sola forma.
// ---------------------------------------------------------------------------

export type CampaignType = 'promotional' | 'branding' | 'launch' | 'seasonal';

export type VisualStyle =
  | 'minimal'
  | 'bold'
  | 'editorial'
  | 'playful'
  | 'vintage'
  | 'futuristic';

export const QUICK_CAMPAIGN_FORMATS = [
  { id: 'instagram-square', label: 'Instagram Feed', width: 1080, height: 1080 },
  { id: 'instagram-story', label: 'Instagram Story', width: 1080, height: 1920 },
  { id: 'facebook-post', label: 'Facebook Post', width: 1200, height: 630 },
  { id: 'linkedin-post', label: 'LinkedIn Post', width: 1200, height: 627 },
] as const;

export type QuickCampaignFormat = (typeof QUICK_CAMPAIGN_FORMATS)[number]['id'];

export const TYPOGRAPHY_OPTIONS = [
  'Inter',
  'Bebas Neue',
  'Playfair Display',
  'Space Grotesk',
  'Instrument Serif',
  'Geist Mono',
] as const;

export const VISUAL_STYLE_OPTIONS: VisualStyle[] = [
  'minimal',
  'bold',
  'editorial',
  'playful',
  'vintage',
  'futuristic',
];

export const CAMPAIGN_TYPE_OPTIONS: { id: CampaignType; label: string }[] = [
  { id: 'promotional', label: 'Promocional' },
  { id: 'branding', label: 'Branding' },
  { id: 'launch', label: 'Lanzamiento' },
  { id: 'seasonal', label: 'Estacional' },
];

export interface CampaignFormData {
  brief: {
    objetivo: string;
    audiencia: string;
    tono: string;
    ocasion: string;
    cta: string;
    restricciones: string[];
    campaignType: CampaignType;
  };
  brand: {
    colors: { primary: string; secondary: string; accent: string };
    typography: { headline: string; body: string };
    style: VisualStyle[];
  };
  references: {
    urls: string[];
    keywords: string[];
  };
  output: {
    formats: QuickCampaignFormat[];
    variationsPerFormat: number;
  };
}

export const INITIAL_FORM_DATA: CampaignFormData = {
  brief: {
    objetivo: '',
    audiencia: '',
    tono: '',
    ocasion: '',
    cta: '',
    restricciones: [],
    campaignType: 'promotional',
  },
  brand: {
    colors: { primary: '#0A0A0A', secondary: '#F5F5F5', accent: '#FF6B35' },
    typography: { headline: 'Bebas Neue', body: 'Inter' },
    style: [],
  },
  references: { urls: [], keywords: [] },
  output: {
    formats: ['instagram-square', 'instagram-story'],
    variationsPerFormat: 2,
  },
};

export const QUICK_CAMPAIGN_STORAGE_KEY = 'canvas:quick-campaign';