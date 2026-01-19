/**
 * Hero Image for Review Wizard
 * Displays course thumbnail with gradient overlay matching CourseReviewsPage design
 */

import React from 'react';
import { cn } from '@/lib/utils';
import type { ReviewWizardCourse } from './types';

interface WizardHeroProps {
  course: ReviewWizardCourse | null;
  className?: string;
}

// Golf-themed fallback image matching CourseReviewsPage
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=400&fit=crop';

export function WizardHero({ course, className }: WizardHeroProps) {
  const imageUrl = course?.thumbnail_image || FALLBACK_IMAGE;
  
  const formatLocation = () => {
    if (!course) return '';
    const parts = [course.sub_country, course.region, course.country].filter(Boolean);
    return parts.join(', ');
  };
  
  return (
    <div className={cn("relative h-[140px] w-full flex-shrink-0", className)}>
      <img
        src={imageUrl}
        alt={course?.name || 'Golf course'}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = FALLBACK_IMAGE;
        }}
      />
      
      {/* Gradient overlay - bottom-weighted for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
      
      {/* Course name and location at bottom */}
      <div className="absolute bottom-3 left-4 right-4">
        <h2 className="text-lg font-bold text-white drop-shadow-lg line-clamp-1">
          {course?.name ?? 'Select a Course'}
        </h2>
        {formatLocation() && (
          <p className="text-xs text-white/80 mt-0.5 drop-shadow line-clamp-1">
            {formatLocation()}
          </p>
        )}
      </div>
    </div>
  );
}
