/**
 * Premium Header for Full-Screen Wizard
 * Back button, title, course info
 */

import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReviewWizardCourse } from './types';

interface WizardHeaderProps {
  course: ReviewWizardCourse | null;
  isEditMode: boolean;
  currentStep: 1 | 2 | 3 | 4;
  isFirstStep: boolean;
  onBack: () => void;
  onClose: () => void;
}

const STEP_TITLES: Record<1 | 2 | 3 | 4, string> = {
  1: 'Rate Course',
  2: 'Write Review',
  3: 'Add Media',
  4: 'Confirm',
};

export function WizardHeader({
  course,
  isEditMode,
  currentStep,
  isFirstStep,
  onBack,
  onClose,
}: WizardHeaderProps) {
  return (
    <header className="relative flex items-center justify-between px-4 py-3 border-b border-border bg-background">
      {/* Left: Back/Close button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={isFirstStep ? onClose : onBack}
        className="rounded-full h-10 w-10 -ml-2"
        aria-label={isFirstStep ? 'Close' : 'Go back'}
      >
        {isFirstStep ? (
          <X className="h-5 w-5" />
        ) : (
          <ArrowLeft className="h-5 w-5" />
        )}
      </Button>

      {/* Center: Title & course name */}
      <div className="absolute left-1/2 -translate-x-1/2 text-center max-w-[60%]">
        <h1 className="font-semibold text-foreground text-base">
          {isEditMode ? 'Edit Review' : STEP_TITLES[currentStep]}
        </h1>
        {course && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {course.name}
          </p>
        )}
      </div>

      {/* Right: Close button (visible only on non-first steps) */}
      {!isFirstStep && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="rounded-full h-10 w-10 -mr-2"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
      
      {/* Invisible placeholder for layout balance on first step */}
      {isFirstStep && <div className="w-10" />}
    </header>
  );
}
