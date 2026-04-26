'use client';

import { CampaignFormData } from '@/lib/types';
import { BriefStep } from './BriefStep';
import { BrandStep } from './BrandStep';
import { ReferencesStep } from './ReferencesStep';
import { OutputStep } from './OutputStep';
import { PreviewStep } from './PreviewStep';
import { ValidationIssue } from './validation';

export function CampaignForm({
  activeStep,
  data,
  onChange,
  issues,
  onJumpTo,
}: {
  activeStep: number;
  data: CampaignFormData;
  onChange: (next: CampaignFormData) => void;
  issues: ValidationIssue[];
  onJumpTo: (step: number) => void;
}) {
  switch (activeStep) {
    case 1:
      return (
        <BriefStep
          value={data.brief}
          onChange={(brief) => onChange({ ...data, brief })}
        />
      );
    case 2:
      return (
        <BrandStep
          value={data.brand}
          onChange={(brand) => onChange({ ...data, brand })}
        />
      );
    case 3:
      return (
        <ReferencesStep
          value={data.references}
          onChange={(references) => onChange({ ...data, references })}
        />
      );
    case 4:
      return (
        <OutputStep
          value={data.output}
          onChange={(output) => onChange({ ...data, output })}
        />
      );
    case 5:
      return <PreviewStep data={data} issues={issues} onJumpTo={onJumpTo} />;
    default:
      return null;
  }
}
