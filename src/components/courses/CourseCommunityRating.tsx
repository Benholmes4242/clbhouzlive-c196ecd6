import React from 'react';
import ClubhouseLogo from '@/components/ui/clubhouse-logo';
import { cn } from '@/lib/utils';

interface CourseCommunityRatingProps {
  rating: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Displays the community rating with the Clubhouse logo.
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
  const sizeClasses = {
    sm: 'h-3.5 w-3.5',
    md: 'h-4 w-4',
    lg: 'h-[19px] w-[19px]',
  }[size];
  
  const textClasses = {
    sm: 'text-[11px]',
    md: 'text-xs',
    lg: 'text-[14px]',
  }[size];

  const isOutstanding = rating >= 9.0;

  return (
    <div className={`flex items-center gap-1 flex-shrink-0 ${className}`}>
      <ClubhouseLogo className={sizeClasses} />
      <span className={cn(
        textClasses,
        'font-semibold',
        isOutstanding ? 'text-amber-500' : 'text-foreground'
      )}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
};

export default CourseCommunityRating;
