/**
 * Hero image for Review Wizard
 * Matches GolfClubView hero with safe area bleed (image extends behind status bar)
 */

import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { formatCourseLocation } from '@/utils/courseLocation';
import type { ReviewWizardCourse } from './types';

interface WizardHeroImageProps {
  course: ReviewWizardCourse | null;
  currentStep: 1 | 2 | 3 | 4;
  onBack: () => void;
  onClose: () => void;
  /** Hide the back button (when header handles navigation) */
  hideBackButton?: boolean;
}

export function WizardHeroImage({ course, currentStep, onBack, onClose, hideBackButton = false }: WizardHeroImageProps) {
  if (!course) return null;

  const isFirstStep = currentStep === 1;

  // Build location string matching formatCourseLocation pattern
  const locationText = formatCourseLocation({
    sub_country: course.sub_country,
    region: course.region,
    country: course.country,
  });

  return (
    <div 
      className="relative overflow-hidden bg-slate-50 shrink-0"
      style={{ 
        // Hero extends into safe area for immersive bleed effect
        // Uses var(--sat) for portal reliability (env() returns 0 in portal contexts)
        height: 'calc(var(--wizard-header-height) * 1.0 + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))',
        paddingTop: 'max(var(--sat, env(safe-area-inset-top, 0px)), 47px)',
      }}
    >
      {/* Background image */}
      {course.thumbnail_image ? (
        <img
          src={course.thumbnail_image}
          alt={course.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 h-full w-full bg-gradient-to-br from-green-400 to-blue-500" />
      )}
      
      {/* Dark gradient overlay for text legibility - matches GolfClubView */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      
      {/* Glass back/close button - positioned below safe area */}
      {/* Hidden when header handles navigation */}
      {!hideBackButton && (
        <button
          type="button"
          onClick={isFirstStep ? onClose : onBack}
          className="absolute left-4 flex h-9 w-9 items-center justify-center rounded-md bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors z-10"
          style={{ top: 'calc(1rem + max(var(--sat, env(safe-area-inset-top, 0px)), 47px))' }}
          aria-label={isFirstStep ? 'Close' : 'Back'}
        >
          {isFirstStep ? (
            <X className="h-5 w-5 text-white" />
          ) : (
            <ArrowLeft className="h-5 w-5 text-white" />
          )}
        </button>
      )}

      {/* Course name and location overlay - matches GolfClubView exactly */}
      <div className="absolute inset-x-0 bottom-4 px-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-white drop-shadow-2xl mb-1">
          {course.name}
        </h1>
        {locationText && (
          <p className="text-sm md:text-base text-white opacity-90 drop-shadow-lg">
            {locationText}
          </p>
        )}
      </div>
    </div>
  );
}
