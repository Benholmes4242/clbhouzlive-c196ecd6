/**
 * CurrentFocusCard - Single premium motivation module
 * Replaces Next Target, Suggested Region, Focus On, Quest Insight
 */

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { CLUB_STEPS } from '@/lib/top100Club';

interface CurrentFocusCardProps {
  totalPlayed: number;
  suggestedRegion?: string;
  onCardClick?: () => void;
  className?: string;
}

// Club tier names mapping
const CLUB_TIER_NAMES: Record<number, string> = {
  5: 'Rookie Club',
  10: 'Fairway Club',
  20: 'Founders Club',
  50: 'Heritage Club',
  100: 'Century Club',
  200: 'Elite Club',
  300: 'Legendary Club',
  400: 'Grand Slam Club',
};

// Get contextual insight based on progress
const getInsight = (totalPlayed: number, remaining: number): string => {
  if (remaining <= 3) {
    return "One great round away.";
  }
  if (totalPlayed === 0) {
    return "Every legend starts with a single step.";
  }
  if (totalPlayed < 10) {
    return "The journey is just beginning.";
  }
  if (totalPlayed < 20) {
    return "Most golfers never reach this point. You're already ahead.";
  }
  if (totalPlayed < 50) {
    return "You're building something remarkable.";
  }
  if (totalPlayed < 100) {
    return "Few have come this far. Keep going.";
  }
  return "Among the true elite.";
};

export const CurrentFocusCard: React.FC<CurrentFocusCardProps> = ({
  totalPlayed,
  suggestedRegion,
  onCardClick,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [animatedWidth, setAnimatedWidth] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLButtonElement>(null);

  // Find next milestone
  const nextMilestone = CLUB_STEPS.find(step => totalPlayed < step.threshold);
  const threshold = nextMilestone?.threshold || 100;
  const tierName = CLUB_TIER_NAMES[threshold] || `${threshold} Club`;
  const remaining = threshold - totalPlayed;
  const progressPercent = (totalPlayed / threshold) * 100;
  const insight = getInsight(totalPlayed, remaining);

  // Animate progress bar on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (isVisible && !prefersReducedMotion) {
      const timer = setTimeout(() => {
        setAnimatedWidth(Math.min(progressPercent, 100));
      }, 400);
      return () => clearTimeout(timer);
    } else if (isVisible) {
      setAnimatedWidth(Math.min(progressPercent, 100));
    }
  }, [isVisible, progressPercent, prefersReducedMotion]);

  // Context line for suggested region
  const getContextLine = () => {
    if (!suggestedRegion) return null;
    
    const regionContextMap: Record<string, string> = {
      'GB & Ireland': 'The British Isles are calling',
      'Continental Europe': 'Continental Europe is calling',
      'USA': 'America awaits',
      'Worldwide': 'The world is your course',
    };
    
    return regionContextMap[suggestedRegion] || `${suggestedRegion} is calling`;
  };

  const contextLine = getContextLine();

  return (
    <section
      className={cn(
        isVisible && !prefersReducedMotion && "quest-animate-scale-in",
        className
      )}
      style={{ animationDelay: '300ms' }}
    >
      <button
        ref={cardRef}
        onClick={onCardClick}
        className={cn(
          "w-full text-left p-6 rounded-2xl transition-all duration-300",
          "hover:shadow-lg active:scale-[0.99]"
        )}
        style={{
          background: 'var(--quest-surface)',
          border: '1px solid var(--quest-stroke)',
          boxShadow: 'var(--quest-shadow-lg)',
        }}
      >
        {/* Card title */}
        <p
          className="text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ color: 'var(--quest-text-tertiary)' }}
        >
          Current Focus
        </p>

        {/* Main content */}
        <div className="mb-5">
          <h3
            className="text-xl font-bold mb-1"
            style={{ color: 'var(--quest-text-primary)' }}
          >
            {tierName}
          </h3>
          <p
            className="text-sm"
            style={{ color: 'var(--quest-text-secondary)' }}
          >
            {remaining} legendary course{remaining !== 1 ? 's' : ''} remain{remaining === 1 ? 's' : ''}
          </p>
        </div>

        {/* Progress bar - thicker, gradient fill */}
        <div
          className="h-3 rounded-full overflow-hidden mb-4"
          style={{ background: 'var(--quest-track)' }}
        >
          <div
            className={cn(
              "h-full rounded-full transition-all ease-out relative",
              !prefersReducedMotion && "quest-progress-highlight-slow"
            )}
            style={{
              width: `${animatedWidth}%`,
              background: 'linear-gradient(90deg, var(--quest-accent-green), var(--quest-accent-gold))',
              transitionDuration: '800ms',
            }}
          />
        </div>

        {/* Context line - narrative, not UI */}
        {contextLine && (
          <p
            className="text-sm mb-4"
            style={{ color: 'var(--quest-accent-green)' }}
          >
            {contextLine}
          </p>
        )}

        {/* Insight - embedded, not separate card */}
        <p
          className="text-xs italic"
          style={{ 
            color: 'var(--quest-text-tertiary)',
            opacity: 0.9,
          }}
        >
          {insight}
        </p>
      </button>
    </section>
  );
};

export default CurrentFocusCard;
