import React from 'react';
import { cn } from '@/lib/utils';

interface CourseCommunityRatingProps {
  rating: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Displays the community rating score.
 * This is the SINGLE source of truth for rating display in course cards.
 * 
 * Rating tier colors:
 * - Outstanding (9.0+): amber-500 (brand accent)
 * - Standard (< 9.0): foreground (neutral)
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

  const isOutstanding = rating >= 9.0;

  return (
    <div className={`flex items-center flex-shrink-0 ${className}`}>
      <span className={cn(
        textClasses,
        'font-semibold tabular-nums',
        isOutstanding ? 'text-amber-500' : 'text-foreground'
      )}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

export default CourseCommunityRating;
