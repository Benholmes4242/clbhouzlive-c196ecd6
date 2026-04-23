// TODO (Phase B): Unify with canonical RatingTier from @/lib/ratingTier.ts
// Currently uses theme-system's RatingTier (underscore format: VERY_GOOD).
import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { getRatingTheme, type RatingTier } from '@/lib/globalAchievementMilestoneSystem';

interface RatingPillProps {
  /** Rating score (0-10) OR a RatingTier key */
  score?: number;
  tier?: RatingTier;
  /** Optional override label */
  label?: string;
  /** Show rating number inside pill (e.g., "VERY GOOD · 7.3") */
  showRatingInPill?: boolean;
  /** Extra classes */
  className?: string;
}

/**
 * Unified Rating Pill Component
 * 
 * Uses slate blue scale for Fair→Excellent, amber for Outstanding.
 * Includes smooth tier change transitions.
 */
export function RatingPill({ score, tier, label, showRatingInPill = false, className }: RatingPillProps) {
  const theme = tier 
    ? getRatingTheme(
        tier === 'OUTSTANDING' ? 9.5 :
        tier === 'EXCELLENT' ? 8.5 :
        tier === 'VERY_GOOD' ? 7.5 :
        tier === 'GOOD' ? 6.5 :
        5
      )
    : getRatingTheme(score ?? 0);

  const displayLabel = label ?? theme.label;
  // Track tier changes for transition animation
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedLabel, setDisplayedLabel] = useState(displayLabel);
  const prevTierRef = useRef(theme.key);
  
  useEffect(() => {
    if (prevTierRef.current !== theme.key) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedLabel(displayLabel);
        setIsTransitioning(false);
      }, 120);
      prevTierRef.current = theme.key;
      return () => clearTimeout(timer);
    } else {
      setDisplayedLabel(displayLabel);
    }
  }, [theme.key, displayLabel]);

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-sq-sm px-3 py-[6px] text-xs font-semibold uppercase tracking-[0.08em]',
        'border rating-label-transition text-white',
        'bg-[#f59e0b] border-[#f59e0b]',
        className
      )}
      data-transitioning={isTransitioning}
    >
      {displayedLabel.toUpperCase()}
      {showRatingInPill && score !== undefined && (
        <>
          <span className="mx-1 opacity-60">·</span>
          <span>{score === 10 ? '10' : score.toFixed(1)}</span>
        </>
      )}
    </span>
  );
}
