/**
 * Hero image for Review Wizard
 * Matches CourseReviewsPage hero header design (200px, gradient, back button)
 */

import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { ReviewWizardCourse } from './types';

interface WizardHeroImageProps {
  course: ReviewWizardCourse | null;
  onClose: () => void;
}

// Golf-themed fallback matching CourseReviewsPage pattern
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&h=400&fit=crop';

export function WizardHeroImage({ course, onClose }: WizardHeroImageProps) {
  if (!course) return null;

  const imageUrl = course.thumbnail_image || FALLBACK_IMAGE;

  return (
    <div className="relative h-[200px] w-full shrink-0">
      {/* Background image */}
      <img
        src={imageUrl}
        alt={course.name}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.src = FALLBACK_IMAGE;
        }}
      />
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/20" />
      
      {/* Back button */}
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 left-4 rounded-full bg-black/40 backdrop-blur-sm p-2 text-white hover:bg-black/60 transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
    </div>
  );
}
