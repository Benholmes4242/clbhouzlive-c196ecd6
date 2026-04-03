/**
 * Wizard Navigation Buttons
 * Hidden on post-submit screens (success, share-success)
 */

import { ArrowLeft, ArrowRight, Loader2, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WizardStepExtended } from './types';

interface WizardNavigationProps {
  currentStep: WizardStepExtended;
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
  // Hide navigation on post-submit screens
  if (currentStep === 'success' || currentStep === 'share-success') {
    return null;
  }

  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 3;
  const isOptionalStep = currentStep === 2;
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
          className="gap-2 min-w-[140px] bg-primary text-primary-foreground hover:bg-primary/90 rounded-full active:scale-[0.97] transition-all duration-200"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {isEditMode ? 'Updating...' : 'Posting...'}
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              {isEditMode ? 'Update Review' : 'Post Review'}
            </>
          )}
        </Button>
      ) : (
        <Button
          size="lg"
          onClick={onNext}
          disabled={!canProceed && !isOptionalStep || isDeleting}
          className="gap-2 min-w-[120px] bg-primary text-primary-foreground hover:bg-primary/90 rounded-full active:scale-[0.97] transition-all duration-200"
        >
          Next →
        </Button>
      )}
    </div>
  );
}
