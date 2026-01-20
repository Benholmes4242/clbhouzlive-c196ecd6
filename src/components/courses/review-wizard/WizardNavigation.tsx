/**
 * Wizard Navigation Buttons
 */

import { ArrowLeft, ArrowRight, Loader2, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WizardNavigationProps {
  currentStep: 1 | 2 | 3 | 4;
  canProceed: boolean;
  isSubmitting: boolean;
  isEditMode?: boolean;
  isDeleting?: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onRemoveReview?: () => void;
}

export function WizardNavigation({
  currentStep,
  canProceed,
  isSubmitting,
  isEditMode = false,
  isDeleting = false,
  onBack,
  onNext,
  onSubmit,
  onRemoveReview,
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 4;
  const isOptionalStep = currentStep === 2 || currentStep === 3;
  const showRemoveButton = isEditMode && isFirstStep && onRemoveReview;

  return (
    <div 
      className="flex items-center justify-between gap-4 px-4 shrink-0"
      style={{ height: 'var(--wizard-nav-height)' }}
    >
      {/* Left side: Back button OR Remove Review button on step 1 in edit mode */}
      {showRemoveButton ? (
        <Button
          variant="ghost"
          size="lg"
          onClick={onRemoveReview}
          disabled={isSubmitting || isDeleting}
          className="gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="lg"
          onClick={onBack}
          disabled={isFirstStep || isSubmitting || isDeleting}
          className={cn(
            "gap-2",
            isFirstStep && "invisible"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      )}

      {/* Next/Submit Button */}
      {isLastStep ? (
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={!canProceed || isSubmitting || isDeleting}
          className="gap-2 min-w-[140px] bg-[#e2e8f0] text-slate-800 hover:bg-[#cbd5e1]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Submit Review
            </>
          )}
        </Button>
      ) : (
        <Button
          size="lg"
          onClick={onNext}
          disabled={(!canProceed && !isOptionalStep) || isDeleting}
          className="gap-2 min-w-[120px] bg-[#e2e8f0] text-slate-800 hover:bg-[#cbd5e1]"
        >
          {isOptionalStep && !canProceed ? 'Skip' : 'Next'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
