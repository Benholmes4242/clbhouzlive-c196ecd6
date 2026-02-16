/**
 * Review Wizard Header - Amber-themed, Post Wizard-aligned
 * Profile selector, trash icon (edit mode only), Next/Submit button
 */

import React from 'react';
import { X, ChevronLeft, ChevronDown, Trash2, Loader2 } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { cn } from '@/lib/utils';
import type { ActiveActor } from '@/context/ActiveActorContext';
import type { WizardStepExtended } from './types';

interface WizardHeaderProps {
  currentStep: WizardStepExtended;
  totalSteps: number;
  isEditMode: boolean;
  canProceed: boolean;
  isSubmitting: boolean;
  isDeleting?: boolean;
  isLoadingUser?: boolean;
  hasHeroAbove?: boolean;
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
  hasHeroAbove = false,
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
  const isLastStep = isNumericStep && currentStep === totalSteps;
  
  // Determine if Next should be Skip (for optional steps 2 and 3)
  const isOptionalStep = isNumericStep && (currentStep === 2 || currentStep === 3);
  const showSkip = isOptionalStep && !canProceed;
  
  const nextButtonText = isLastStep 
    ? (isEditMode ? 'Update' : 'Submit') 
    : (showSkip ? 'Skip' : 'Next');
  
  // Fix 1: Remove isLoadingUser from submit gate — by Step 4, user is already authenticated.
  const isNextEnabled = isLastStep 
    ? (canProceed && !isSubmitting && !isDeleting)
    : (showSkip || (canProceed && !isDeleting));


  // Only show header for numeric steps (1-4)
  if (!isNumericStep) return null;
  
  const getInitials = (name: string) => name.charAt(0).toUpperCase();
  
  const handleBackOrClose = () => {
    if (isFirstStep) {
      onClose();
    } else {
      onBack();
    }
  };
  
  const handleNextOrSubmit = () => {
    if (isSubmitting || isDeleting) return;
    if (isLastStep) {
      onSubmit();
    } else {
      onNext();
    }
  };

  return (
    <header 
      className="sticky top-0 z-10 flex items-center justify-between px-3"
      style={{ 
        paddingTop: hasHeroAbove ? '0px' : 'max(env(safe-area-inset-top, 0px), 47px)',
        minHeight: hasHeroAbove ? '48px' : 'calc(48px + max(env(safe-area-inset-top, 0px), 47px))',
        background: 'transparent'
      }}
    >
      {/* Left: Close/Back + Trash (edit mode only) */}
      <div className="flex items-center gap-1 min-w-[72px]">
        {hasHeroAbove ? (
          /* Steps 1-2: Amber pill style below hero */
          <button
            onClick={handleBackOrClose}
            className="w-9 h-9 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center active:bg-amber-200/80 active:scale-[0.97] transition-all duration-100 disabled:opacity-50"
            aria-label={isFirstStep ? 'Close' : 'Back'}
            disabled={isSubmitting || isDeleting}
          >
            {isFirstStep ? (
              <X className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        ) : (
          /* Steps 3-4: Amber treatment */
          <button
            onClick={handleBackOrClose}
            className="w-9 h-9 rounded-full bg-amber-100/80 text-amber-700 flex items-center justify-center active:bg-amber-200/80 active:scale-[0.97] transition-all duration-100 disabled:opacity-50"
            aria-label={isFirstStep ? 'Close' : 'Back'}
            disabled={isSubmitting || isDeleting}
          >
            {isFirstStep ? (
              <X className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        )}
        
        {/* Trash icon - Edit Mode only */}
        {isEditMode && (
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-50"
            aria-label="Delete review"
            disabled={isSubmitting || isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Center: Profile Selector */}
      <div className="flex-1 flex justify-center">
        <button 
          onClick={onOpenProfileSelector}
          disabled={isSubmitting || isDeleting}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full transition-colors hover:bg-muted/60 active:bg-muted/80 disabled:opacity-50"
        >
          <SquircleAvatar
            size={24}
            src={selectedActor?.avatarUrl}
            alt={selectedActor?.name || 'Profile'}
            fallback={getInitials(selectedActor?.name || 'U')}
            hideRing
            className="shadow-sm"
          />
          {selectedActor?.verified && <VerifiedBadge size="sm" />}
          <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
        </button>
      </div>
      
      {/* Right: Next/Skip/Submit button */}
      <div className="flex items-center min-w-[72px] justify-end">
        <button
          onClick={handleNextOrSubmit}
          disabled={!isNextEnabled}
          className={cn(
            'px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 active:scale-[0.97]',
            isNextEnabled
              ? isLastStep 
                ? 'text-white'
                : 'text-white'
              : 'bg-amber-100/80 text-amber-700 cursor-not-allowed'
          )}
          style={isNextEnabled ? {
            background: isLastStep 
              ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' 
              : '#f59e0b',
          } : undefined}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {isEditMode ? 'Updating...' : 'Submitting...'}
            </span>
          ) : (
            nextButtonText
          )}
        </button>
      </div>
    </header>
  );
}
