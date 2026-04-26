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