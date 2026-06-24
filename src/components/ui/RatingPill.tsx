import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { getRatingTheme } from '@/lib/globalAchievementMilestoneSystem';
import { getRatingTier, getRatingTierLabel, ratingTextColor, type RatingTier } from '@/lib/ratingTier';

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
 * Colour follows the canonical graduated tier system
 * (grey poor/fair → amber good/excellent → gold exceptional)
 * via `ratingTextColor` so every surface stays consistent.
 */
export function RatingPill({ score, tier, label, showRatingInPill = false, className }: RatingPillProps) {
  // Midpoint per canonical 5-tier banding (see src/lib/ratingTier.ts).
  const TIER_TO_MIDPOINT: Record<RatingTier, number> = {
    EXCEPTIONAL: 9.5,
    EXCELLENT: 8.2,
    GOOD: 6.7,
    FAIR: 5.0,
    POOR: 2.0,
  };
  const resolvedScore = tier ? TIER_TO_MIDPOINT[tier] : (score ?? 0);
  const resolvedTier = tier ?? getRatingTier(resolvedScore);
  const displayLabel = label ?? getRatingTierLabel(resolvedScore);
  const fill = ratingTextColor(resolvedScore);

  // Track tier changes for transition animation
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedLabel, setDisplayedLabel] = useState(displayLabel);
  const prevTierRef = useRef(resolvedTier);

  useEffect(() => {
    if (prevTierRef.current !== resolvedTier) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setDisplayedLabel(displayLabel);
        setIsTransitioning(false);
      }, 120);
      prevTierRef.current = resolvedTier;
      return () => clearTimeout(timer);
    } else {
      setDisplayedLabel(displayLabel);
    }
  }, [resolvedTier, displayLabel]);

  // Keep getRatingTheme import alive for any future theme needs; reference once.
  void getRatingTheme;

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-sq-sm px-3 py-[6px] text-xs font-semibold uppercase tracking-[0.08em]',
        'border rating-label-transition text-white',
        className
      )}
      style={{ backgroundColor: fill, borderColor: fill }}
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
