import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { getRatingTheme } from '@/lib/globalAchievementMilestoneSystem';
import type { RatingTier } from '@/lib/ratingTier';

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
 * Uses slate scale for Excellent→Poor, amber for Exceptional (≥9.0).
 * Includes smooth tier change transitions.
 */
export function RatingPill({ score, tier, label, showRatingInPill = false, className }: RatingPillProps) {
  // Midpoint per canonical 5-tier banding (see src/lib/ratingTier.ts).
  // Record<RatingTier, number> gives compile-time exhaustiveness — future
  // RatingTier additions will fail here until a midpoint is provided.
  const TIER_TO_MIDPOINT: Record<RatingTier, number> = {
    EXCEPTIONAL: 9.5, // midpoint of ≥9.0
    EXCELLENT: 8.2,   // midpoint of 7.5-8.9
    GOOD: 6.7,        // midpoint of 6.0-7.4
    FAIR: 5.0,        // midpoint of 4.0-5.9
    POOR: 2.0,        // midpoint of 0-3.9
  };
  const theme = tier
    ? getRatingTheme(TIER_TO_MIDPOINT[tier])
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
