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
 * Uses slate styling for Fair→Excellent, gold only for Outstanding.
 * Phase 3A: Includes smooth tier change transitions.
 * 
 * @example
 * <RatingPill score={8.5} />
 * <RatingPill score={8.5} showRatingInPill />
 * <RatingPill tier="EXCELLENT" label="Custom Label" />
 */
export function RatingPill({ score, tier, label, showRatingInPill = false, className }: RatingPillProps) {
  // Get theme from score or tier (for label only)
  const theme = tier 
    ? getRatingTheme(
        tier === 'OUTSTANDING' ? 9.5 :
        tier === 'EXCELLENT' ? 8.5 :
        tier === 'VERY_GOOD' ? 7.5 :
        tier === 'GOOD' ? 6.5 :
        tier === 'FAIR' ? 5 :
        5
      )
    : getRatingTheme(score ?? 0);

  const displayLabel = label ?? theme.label;
  const ratingValue = score ?? (tier === 'OUTSTANDING' ? 9.5 : tier === 'EXCELLENT' ? 8.5 : 7);
  
  // Determine if Outstanding (gold) or standard (slate)
  const isOutstanding = theme.key === 'OUTSTANDING';
  
  // Phase 3A: Track tier changes for transition animation
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayedLabel, setDisplayedLabel] = useState(displayLabel);
  const prevTierRef = useRef(theme.key);
  
  useEffect(() => {
    // Only animate if tier actually changed (not just decimal value)
    if (prevTierRef.current !== theme.key) {
      setIsTransitioning(true);
      
      // After fade out, update label and fade in
      const timer = setTimeout(() => {
        setDisplayedLabel(displayLabel);
        setIsTransitioning(false);
      }, 120);
      
      prevTierRef.current = theme.key;
      return () => clearTimeout(timer);
    } else {
      // No tier change - update immediately
      setDisplayedLabel(displayLabel);
    }
  }, [theme.key, displayLabel]);

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center',
        'rounded-sq-sm px-3 py-[6px] text-xs font-semibold uppercase tracking-[0.08em]',
        'border rating-label-transition',
        // UNIFIED: Amber for Outstanding (9+), Warm Stone for rest
        isOutstanding 
          ? 'bg-[#f59e0b] text-white border-[#f59e0b]'
          : 'bg-[#A8A29E] text-white border-[#A8A29E]',
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
