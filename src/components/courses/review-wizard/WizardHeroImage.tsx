/**
 * Hero image for Review Wizard
 * Matches GolfClubView hero exactly (h-64, glass back button, name/location overlay)
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { formatCourseLocation } from '@/utils/courseLocation';
import type { ReviewWizardCourse } from './types';

interface WizardHeroImageProps {
  course: ReviewWizardCourse | null;
  onClose: () => void;
}

export function WizardHeroImage({ course, onClose }: WizardHeroImageProps) {
  if (!course) return null;

  // Build location string matching formatCourseLocation pattern
  const locationText = formatCourseLocation({
    sub_country: course.sub_country,
    region: course.region,
    country: course.country,
  });

  return (
    <div className="relative h-36 overflow-hidden bg-slate-50 shrink-0">
      {/* Background image */}
      {course.thumbnail_image ? (
        <img
          src={course.thumbnail_image}
          alt={course.name}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-green-400 to-blue-500" />
      )}
      
      {/* Dark gradient overlay for text legibility - matches GolfClubView */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      
      {/* Glass back button - matches GolfClubView exactly */}
      <button
        type="button"
        onClick={onClose}
        className="absolute left-4 top-4 flex h-9 w-9 items-center justify-center rounded-md bg-black/20 backdrop-blur-sm hover:bg-black/40 transition-colors z-10"
        aria-label="Back"
      >
        <ArrowLeft className="h-5 w-5 text-white" />
      </button>

      {/* Course name and location overlay - compact version */}
      <div className="absolute inset-x-0 bottom-2 px-4">
        <h1 className="text-xl font-semibold text-white drop-shadow-lg line-clamp-1">
          {course.name}
        </h1>
        {locationText && (
          <p className="text-sm text-white/90 drop-shadow-md line-clamp-1">
            {locationText}
          </p>
        )}
      </div>
    </div>
  );
}
