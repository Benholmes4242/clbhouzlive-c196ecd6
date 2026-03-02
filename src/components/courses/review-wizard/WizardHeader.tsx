/**
 * Review Wizard Header - Consistent across all steps
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
  const isLastStep = isNumericStep && currentStep === totalSteps;
  
  const isOptionalStep = isNumericStep && (currentStep === 2 || currentStep === 3);
  const showSkip = isOptionalStep && !canProceed;
  
  const nextButtonText = isLastStep 
    ? (isEditMode ? 'Update' : 'Submit') 
    : (showSkip ? 'Skip' : 'Next');
  
  const isNextEnabled = isLastStep 
    ? (canProceed && !isSubmitting && !isDeleting)
    : (showSkip || (canProceed && !isDeleting));

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
        paddingTop: 'max(env(safe-area-inset-top, 0px), 47px)',
        minHeight: 'calc(48px + max(env(safe-area-inset-top, 0px), 47px))',
        background: 'transparent'
      }}
    >
      {/* Left: Close/Back + Trash (edit mode only) */}
      <div className="flex items-center gap-1 min-w-[72px]">
        <button
          onClick={handleBackOrClose}
          className="w-11 h-11 rounded-full flex items-center justify-center active:scale-[0.97] transition-all duration-100 disabled:opacity-50"
          style={{
            background: '#F5F5F7',
          }}
          aria-label={isFirstStep ? 'Close' : 'Back'}
          disabled={isSubmitting || isDeleting}
        >
          {isFirstStep ? (
            <X className="h-[18px] w-[18px]" style={{ color: '#8E8E93' }} />
          ) : (
            <ChevronLeft className="h-5 w-5 text-foreground" />
          )}
        </button>
        
        {/* Trash icon - Edit Mode only */}
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
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>
      
      {/* Right: Next/Skip/Submit button */}
      <div className="flex items-center min-w-[72px] justify-end">
        <button
          onClick={handleNextOrSubmit}
          disabled={!isNextEnabled}
          className="text-[15px] font-semibold px-[18px] py-[7px] rounded-full transition-all duration-200 active:scale-[0.96]"
          style={{
            background: isLastStep
              ? (isNextEnabled ? '#f59e0b' : '#F5F5F7')
              : (isNextEnabled ? '#1C1C1E' : '#F5F5F7'),
            color: isLastStep
              ? (isNextEnabled ? '#FFFFFF' : '#AEAEB2')
              : (isNextEnabled ? '#FFFFFF' : '#AEAEB2'),
            boxShadow: isLastStep && isNextEnabled ? '0 2px 12px rgba(245,158,11,0.22)' : 'none',
            pointerEvents: isNextEnabled ? 'auto' : 'none',
          }}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1.5">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {isEditMode ? 'Updating…' : 'Submitting…'}
            </span>
          ) : (
            nextButtonText
          )}
        </button>
      </div>
    </header>
  );
}
