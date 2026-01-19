/**
 * Wizard Navigation Buttons
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WizardNavigationProps {
  currentStep: 1 | 2 | 3 | 4;
  canProceed: boolean;
  isSubmitting: boolean;
  hasUploadsInProgress: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function WizardNavigation({
  currentStep,
  canProceed,
  isSubmitting,
  hasUploadsInProgress,
  onBack,
  onNext,
  onSubmit,
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 4;
  const isOptionalStep = currentStep === 2 || currentStep === 3;

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 border-t border-border bg-background/80 backdrop-blur-sm">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="lg"
        onClick={onBack}
        disabled={isFirstStep || isSubmitting}
        className={cn(
          "gap-2",
          isFirstStep && "invisible"
        )}
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Button>

      {/* Next/Submit Button */}
      {isLastStep ? (
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={!canProceed || isSubmitting}
          className="gap-2 min-w-[140px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : hasUploadsInProgress ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading...
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
          disabled={!canProceed && !isOptionalStep}
          className="gap-2 min-w-[120px]"
        >
          {isOptionalStep && !canProceed ? 'Skip' : 'Next'}
          <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
