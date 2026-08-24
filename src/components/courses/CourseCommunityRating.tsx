import React from 'react';
import { cn } from '@/lib/utils';
import { formatRatingValue } from '@/utils/formatters';
import { bandColorOnDark } from '@/features/courses/_shared/scoreBands';


interface CourseCommunityRatingProps {
  rating: number;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Show the Clbhouz orange logomark to the left of the rating */
  showLogo?: boolean;
  /** Force the rating text to foreground color regardless of tier */
  forceNeutral?: boolean;
  /** Dark/photographic surface: the non-amber tier renders near-white instead of foreground. */
  onDark?: boolean;
}

/**
 * Displays the community rating score.
 * This is the SINGLE source of truth for rating display in course cards.
 *
 * Colour comes from the one member-score band scale (scoreBands):
 * - >= 9.0  BAND_GREEN  #047857
 * - >= 5.0  BAND_AMBER  #F7931E
 * -  < 5.0  BAND_RED    #DC2626
 *
 * `forceNeutral` overrides the band entirely: foreground on light, near-white
 * when `onDark` is also set. Banded ratings always use the lifted dark-surface
 * scale; this replaces the older assumption that the light bands read on dark.
 */
export const CourseCommunityRating: React.FC<CourseCommunityRatingProps> = ({
  rating,
  className = '',
  size = 'md',
  showLogo = false,
  forceNeutral = false,
  onDark = false,
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
      <span
        className={cn(
          textClasses,
          'font-semibold tabular-nums',
          forceNeutral && !onDark ? 'text-foreground' : ''
        )}
        style={
          forceNeutral
            ? onDark
              ? { color: 'rgba(255,255,255,0.95)' }
              : undefined
            : { color: bandColorOnDark(rating) }
        }
      >
        {formatRatingValue(rating)}
      </span>

    </div>
  );
};

export default CourseCommunityRating;