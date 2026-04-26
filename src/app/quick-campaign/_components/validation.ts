import { CampaignFormData } from '@/lib/types';

export type ValidationIssue = {
  field: 'brief.objetivo' | 'output.formats';
  message: string;
  jumpToStep: 1 | 4;
};

export function validateCampaign(data: CampaignFormData): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!data.brief.objetivo.trim()) {
    issues.push({
      field: 'brief.objetivo',
      message: 'Falta el objetivo de la campaña.',
      jumpToStep: 1,
    });
  }
  if (data.output.formats.length === 0) {
    issues.push({
      field: 'output.formats',
      message: 'Selecciona al menos un formato de salida.',
      jumpToStep: 4,
    });
  }
  return issues;
}