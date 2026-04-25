import React from 'react';
import { cn } from '@/lib/utils';

interface CourseCommunityRatingProps {
  rating: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Show the Clbhouz orange logomark to the left of the rating */
  showLogo?: boolean;
  /** Force the rating text to foreground color regardless of tier */
  forceNeutral?: boolean;
}

/**
 * Displays the community rating score.
 * This is the SINGLE source of truth for rating display in course cards.
 * 
 * Rating tier colors (5-tier system, Apr 2026):
 * - Exceptional (≥9.0): amber-500 (brand accent) — unless forceNeutral is set
 * - Excellent / Good / Fair / Poor (< 9.0): foreground (neutral)
 */
export const CourseCommunityRating: React.FC<CourseCommunityRatingProps> = ({
  rating,
  className = '',
  size = 'md',
  showLogo = false,
  forceNeutral = false,
}) => {
  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }[size];

  const logoSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-[18px] h-[18px]',
  }[size];

  return (
    <div className={`flex items-center flex-shrink-0 gap-1.5 ${className}`}>
      {showLogo && (
        <img
          src="/assets/logomark-orange.png"
          alt=""
          className={cn(logoSize, 'object-contain')}
          aria-hidden="true"
        />
      )}
      <span className={cn(
        textClasses,
        'font-semibold tabular-nums',
        forceNeutral ? 'text-foreground' : 'text-amber-500'
      )}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

export default CourseCommunityRating;