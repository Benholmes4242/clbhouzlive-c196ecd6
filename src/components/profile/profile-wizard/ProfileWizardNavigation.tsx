/**
 * Backward-compatible ProfileWizardNavigation for business wizard
 */
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface Props {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  submitLabel?: string;
}

export function ProfileWizardNavigation({
  currentStep, totalSteps, canProceed, isSubmitting,
  onBack, onNext, onSubmit, submitLabel = 'Save',
}: Props) {
  const isFinalStep = currentStep === totalSteps;

  return (
    <div
      className="px-4 pt-3 bg-background border-t border-border"
      style={{ paddingBottom: 'calc(var(--sab) + 16px)' }}
    >
      <div className="flex gap-3">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 min-h-[50px] rounded-xl text-[15px] font-semibold"
          >
            Back
          </Button>
        )}
        <Button
          onClick={isFinalStep ? onSubmit : onNext}
          disabled={!canProceed || isSubmitting}
          className="flex-1 min-h-[50px] rounded-xl text-[15px] font-semibold"
        >
          {isSubmitting ? (
            <><Loader2 size={18} className="animate-spin mr-2" /> Saving…</>
          ) : isFinalStep ? (
            submitLabel
          ) : (
            'Continue'
          )}
        </Button>
      </div>
    </div>
  );
}
