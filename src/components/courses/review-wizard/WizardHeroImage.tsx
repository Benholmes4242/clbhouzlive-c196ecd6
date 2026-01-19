/**
 * Hero image for Review Wizard
 * Matches CourseReviewsPage hero header design standard
 */

import React from 'react';
import type { ReviewWizardCourse } from './types';

interface WizardHeroImageProps {
  course: ReviewWizardCourse | null;
}

// Golf-themed fallback matching CourseReviewsPage pattern
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&auto=format&fit=crop';

export function WizardHeroImage({ course }: WizardHeroImageProps) {
  if (!course) return null;

  const imageUrl = course.thumbnail_image || FALLBACK_IMAGE;
  
  // Build location string
  const locationParts = [course.sub_country, course.country].filter(Boolean);
  const locationText = locationParts.join(', ');

  return (
    <div className="relative w-full h-[140px] shrink-0 overflow-hidden">
      {/* Background image */}
      <img
        src={imageUrl}
        alt={course.name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      
      {/* Bottom-weighted gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
      
      {/* Course info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
        <h2 className="font-semibold text-lg leading-tight line-clamp-1">
          {course.name}
        </h2>
        {locationText && (
          <p className="text-sm text-white/80 mt-0.5">
            {locationText}
          </p>
        )}
      </div>
    </div>
  );
}
