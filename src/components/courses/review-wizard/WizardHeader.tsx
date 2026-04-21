/**
 * Review Wizard Header - Consistent across all steps
 * Profile selector, trash icon (edit mode only), Next/Submit button
 */

import React from 'react';
import { X, ChevronLeft, ChevronDown, Trash2, Loader2 } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type { ActiveActor } from '@/context/ActiveActorContext';
import type { WizardStepExtended } from './types';

const STEP_LABELS = ['RATE', 'WRITE', 'POST'] as const;

interface WizardHeaderProps {
  currentStep: WizardStepExtended;
  totalSteps: number;
  isEditMode: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  isDeleting?: boolean;
  isLoadingUser?: boolean;
  selectedActor: ActiveActor | null;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  onClose: () => void;
  onDelete: () => void;
  onOpenProfileSelector: () => void;
}

export function WizardHeader({
  currentStep,
  totalSteps,
  isEditMode,
  canProceed,
  isSubmitting,
  isDeleting = false,
  isLoadingUser = false,
  selectedActor,
  onBack,
  onNext,
  onSubmit,
  onClose,
  onDelete,
  onOpenProfileSelector,
}: WizardHeaderProps) {
  const isNumericStep = typeof currentStep === 'number';
  const isFirstStep = isNumericStep && currentStep === 1;
  const isLastStep = isNumericStep && currentStep === 3;

  // Step 2 always shows "Next →", Step 3 shows "Post Review" / "Update"
  const nextButtonText = isLastStep
    ? (isEditMode ? 'Update' : 'Post Review')
    : 'Next →';

  const isNextEnabled = isLastStep
    ? (canProceed && !isSubmitting && !isDeleting)
    : (canProceed && !isDeleting);

  if (!isNumericStep) return null;

  

  const handleBackOrClose = () => {
    if (isFirstStep) {
      onClose();
    } else {
      onBack();
    }
  };

  const handleNextOrSubmit = () => {
    if (isSubmitting || isDeleting) return;
    // Guard: step 1 requires a rating
    if (currentStep === 1 && !canProceed) {
      toast('Add a rating to continue');
      return;
    }
    if (isLastStep) {
      onSubmit();
    } else {
      onNext();
    }
  };

  const stepNumber = currentStep as number;

  return (
    <header
      className="sticky top-0 z-10 flex flex-col px-3"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        minHeight: 'calc(48px + max(env(safe-area-inset-top, 0px), 47px))',
        background: 'transparent',
      }}
    >
      {/* Top row: Close/Back, Profile, Next */}
      <div className="flex items-center justify-between">
        {/* Left: Close/Back + Trash (edit mode only) */}
        <div className="flex items-center gap-1 min-w-[72px]">
          <button
            onClick={handleBackOrClose}
            className="w-11 h-11 rounded-full flex items-center justify-center active:scale-[0.97] transition-all duration-100 disabled:opacity-50"
            style={{ background: '#F5F5F7' }}
            aria-label={isFirstStep ? 'Close' : 'Back'}
            disabled={isSubmitting || isDeleting}
          >
            {isFirstStep ? (
              <X className="h-[18px] w-[18px]" style={{ color: '#8E8E93' }} />
            ) : (
              <ChevronLeft className="h-5 w-5 text-foreground" />
            )}
          </button>

          {isEditMode && (
            <button
              onClick={onDelete}
              className="w-11 h-11 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
              aria-label="Delete review"
              disabled={isSubmitting || isDeleting}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Center: Labelled progress dots */}
        <div className="flex-1 flex justify-center">
          <div className="flex items-center gap-4">
            {STEP_LABELS.map((label, i) => {
              const dotStep = i + 1;
              const isCompleted = stepNumber > dotStep;
              const isActive = stepNumber === dotStep;
              const isFuture = stepNumber < dotStep;

              return (
                <div key={label} className="flex flex-col items-center gap-1">
                  {/* Dot */}
                  <div
                    className="flex items-center justify-center transition-all duration-200"
                    style={{
                      width: isActive ? 20 : 10,
                      height: 10,
                      borderRadius: 99,
                      background: isCompleted
                        ? '#F7931E'
                        : isActive
                          ? 'transparent'
                          : '#D1D5DB',
                      border: isActive ? '2px solid #F7931E' : 'none',
                    }}
                  >
                    {isCompleted && (
                      <span style={{ fontSize: 7, color: '#fff', fontWeight: 700 }}>✓</span>
                    )}
                  </div>
                  {/* Label */}
                  <span
                    className="text-[9px] font-semibold tracking-wider"
                    style={{
                      color: isCompleted || isActive ? '#F7931E' : '#9CA3AF',
                    }}
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Next/Submit button */}
        <div className="flex items-center min-w-[72px] justify-end">
          <button
            onClick={handleNextOrSubmit}
            disabled={!isNextEnabled}
            className="text-[13px] font-semibold px-[14px] min-h-[36px] flex items-center rounded-full transition-all duration-200 active:scale-[0.96]"
            style={{
              background: isLastStep
                ? (isNextEnabled ? '#F7931E' : '#F5F5F7')
                : (isNextEnabled ? '#1C1C1E' : '#F5F5F7'),
              color: isLastStep
                ? (isNextEnabled ? '#FFFFFF' : '#AEAEB2')
                : (isNextEnabled ? '#FFFFFF' : '#AEAEB2'),
              boxShadow: isLastStep && isNextEnabled ? '0 2px 12px rgba(247,147,30,0.22)' : 'none',
              pointerEvents: isNextEnabled ? 'auto' : 'none',
            }}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {isEditMode ? 'Updating…' : 'Posting…'}
              </span>
            ) : (
              nextButtonText
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
