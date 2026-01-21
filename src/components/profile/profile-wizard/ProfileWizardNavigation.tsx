/**
 * ProfileWizardNavigation - Bottom navigation for profile wizards
 * Back + Next/Save buttons with loading states
 */
import { Loader2, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ProfileWizardNavigationProps } from './types';

export function ProfileWizardNavigation({
  currentStep,
  totalSteps,
  canProceed,
  isSubmitting,
  onBack,
  onNext,
  onSubmit,
  submitLabel = 'Save Profile',
}: ProfileWizardNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="sticky bottom-0 z-10 bg-[#F8FAFC] border-t border-border/50 px-4 py-3 pb-safe">
      <div className="flex items-center gap-3">
        {/* Back button - hidden on first step */}
        {!isFirstStep && (
          <Button
            variant="outline"
            size="lg"
            onClick={onBack}
            disabled={isSubmitting}
            className="flex-1 rounded-xl border-[#e2e8f0] font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        )}
        
        {/* Next/Submit button */}
        <Button
          size="lg"
          onClick={isLastStep ? onSubmit : onNext}
          disabled={!canProceed || isSubmitting}
          className={cn(
            "flex-1 rounded-xl font-semibold transition-all",
            isFirstStep && "w-full",
            (!canProceed || isSubmitting) && "opacity-50"
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : isLastStep ? (
            <>
              <Check className="h-4 w-4 mr-2" />
              {submitLabel}
            </>
          ) : (
            <>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

export default ProfileWizardNavigation;
