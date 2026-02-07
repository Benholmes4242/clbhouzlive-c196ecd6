/**
 * Review Wizard Header - Post Wizard-style header
 * Profile selector, trash icon (edit mode only), Next/Submit button
 */

import React from 'react';
import { X, ChevronLeft, ChevronDown, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  
  // Fix 1: Submit button always shows "Submit" — auth validation happens on tap, not on render
  const nextButtonText = isLastStep 
    ? 'Submit' 
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
      className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 backdrop-blur-md px-3"
      style={{ 
        paddingTop: hasHeroAbove ? '0px' : 'max(env(safe-area-inset-top, 0px), 47px)',
        minHeight: hasHeroAbove ? '48px' : 'calc(48px + max(env(safe-area-inset-top, 0px), 47px))'
      }}
    >
      {/* Left: Close/Back + Trash (edit mode only) */}
      <div className="flex items-center gap-1 min-w-[72px]">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackOrClose}
          className="h-8 w-8 rounded-full"
          aria-label={isFirstStep ? 'Close' : 'Back'}
          disabled={isSubmitting || isDeleting}
        >
          {isFirstStep ? (
            <X className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
        
        {/* Trash icon - Edit Mode only */}
        {isEditMode && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
            aria-label="Delete review"
            disabled={isSubmitting || isDeleting}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
          />
          <span className="font-medium text-sm max-w-[140px] truncate text-foreground">
            {selectedActor?.name || 'Select'}
          </span>
          {selectedActor?.verified && <VerifiedBadge size="sm" />}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
      
      {/* Right: Next/Submit button */}
      <div className="flex items-center min-w-[72px] justify-end">
        <Button
          size="sm"
          onClick={handleNextOrSubmit}
          disabled={!isNextEnabled}
          className={cn(
            'px-4 py-1.5 h-8 rounded-full text-sm font-medium transition-all duration-200',
            isNextEnabled
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              Submitting...
            </>
          ) : (
            nextButtonText
          )}
        </Button>
      </div>
    </header>
  );
}