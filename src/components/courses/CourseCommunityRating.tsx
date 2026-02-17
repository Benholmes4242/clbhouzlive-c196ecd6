import React from 'react';
import { cn } from '@/lib/utils';
import { courseDetailTokens } from '@/styles/course-detail-tokens';
import { getTierKeyFromScore } from '@/hooks/useTierStyles';

interface CourseCommunityRatingProps {
  rating: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Displays the community rating score with tier-aware coloring.
 * This is the SINGLE source of truth for rating display in course cards.
 */
export const CourseCommunityRating: React.FC<CourseCommunityRatingProps> = ({
  rating,
  className = '',
  size = 'md',
}) => {
  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  const tierKey = getTierKeyFromScore(rating);
  const tier = courseDetailTokens.tiers[tierKey];

  return (
    <div className={`flex items-center flex-shrink-0 ${className}`}>
      <span
        className={cn(textClasses, 'font-semibold tabular-nums')}
        style={{ color: tier.numberColor }}
      >
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

export default CourseCommunityRating;
