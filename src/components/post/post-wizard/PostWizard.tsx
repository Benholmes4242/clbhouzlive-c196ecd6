// Post Wizard - Main Component Shell
// Multi-step post creation wizard following Review Wizard pattern

import { useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostWizardProps, PostWizardStep } from './types';
import { usePostWizard } from './usePostWizard';
import { cn } from '@/lib/utils';

// Step titles for header
const STEP_TITLES: Record<PostWizardStep, string> = {
  media: 'Add Media',
  caption: 'Add Details',
  confirm: 'Review & Post',
};

export function PostWizard({
  isOpen,
  onClose,
  initialMedia,
  initialCourse,
  initialActorOverride,
}: PostWizardProps) {
  const {
    state,
    dispatch,
    nextStep,
    prevStep,
    isFirstStep,
    isLastStep,
    currentStepIndex,
    totalSteps,
    canProceedFromMedia,
    canSubmit,
    reset,
  } = usePostWizard({
    initialMedia,
    initialCourse,
    initialActorOverride,
  });

  // Lock body scroll when open
  useEffect(() => {
    if (!isOpen) return;

    const scrollY = window.scrollY;
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  // Handle close with dirty check
  const handleClose = useCallback(() => {
    if (state.isDirty) {
      // TODO: Show confirmation dialog
      onClose();
    } else {
      onClose();
    }
  }, [state.isDirty, onClose]);

  // Handle back navigation
  const handleBack = useCallback(() => {
    if (isFirstStep) {
      handleClose();
    } else {
      prevStep();
    }
  }, [isFirstStep, handleClose, prevStep]);

  // Handle next/submit
  const handleNext = useCallback(() => {
    if (isLastStep) {
      // TODO: Submit post
      console.log('Submit post', state);
    } else {
      nextStep();
    }
  }, [isLastStep, nextStep, state]);

  // Determine if next button should be enabled
  const canProceed = state.currentStep === 'media' 
    ? canProceedFromMedia 
    : state.currentStep === 'confirm' 
      ? canSubmit 
      : true;

  // Get next button text
  const nextButtonText = isLastStep ? 'Post' : 'Next';

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-background"
        style={{ touchAction: 'none' }}
      >
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background px-3">
          {/* Left: Back/Close button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
            className="h-9 w-9"
            aria-label={isFirstStep ? 'Close' : 'Back'}
          >
            {isFirstStep ? (
              <X className="h-5 w-5" />
            ) : (
              <ArrowLeft className="h-5 w-5" />
            )}
          </Button>

          {/* Center: Step title & progress */}
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium">
              {STEP_TITLES[state.currentStep]}
            </span>
            <span className="text-xs text-muted-foreground">
              Step {currentStepIndex + 1} of {totalSteps}
            </span>
          </div>

          {/* Right: Next/Post button */}
          <Button
            variant={isLastStep ? 'default' : 'ghost'}
            size="sm"
            onClick={handleNext}
            disabled={!canProceed || state.isSubmitting}
            className={cn(
              'min-w-[60px]',
              isLastStep && 'bg-primary text-primary-foreground'
            )}
          >
            {state.isSubmitting ? 'Posting...' : nextButtonText}
          </Button>
        </header>

        {/* Progress bar */}
        <div className="h-1 w-full bg-muted">
          <motion.div
            className="h-full bg-primary"
            initial={{ width: 0 }}
            animate={{
              width: `${((currentStepIndex + 1) / totalSteps) * 100}%`,
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>

        {/* Step content */}
        <main className="h-[calc(100vh-60px)] overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={state.currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {/* Step placeholder content - will be replaced with actual step components */}
              <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
                <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8">
                  <p className="text-center text-muted-foreground">
                    {state.currentStep === 'media' && 'MediaStep component goes here'}
                    {state.currentStep === 'caption' && 'CaptionStep component goes here'}
                    {state.currentStep === 'confirm' && 'ConfirmStep component goes here'}
                  </p>
                </div>
                
                {/* Debug state display */}
                <details className="w-full max-w-md">
                  <summary className="cursor-pointer text-xs text-muted-foreground">
                    Debug State
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded bg-muted p-2 text-xs">
                    {JSON.stringify(state, null, 2)}
                  </pre>
                </details>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

export default PostWizard;
