/**
 * NextTargetCard - Motivation engine with Quest Insight
 * Features: Enhanced progress bar, Quest Insight card, icons
 */

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Target, Trophy, Share2, Compass, MapPin, Lightbulb } from 'lucide-react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface NextTargetCardProps {
  totalPlayed: number;
  nextMilestone?: {
    name: string;
    threshold: number;
  };
  recentlyUnlocked?: string;
  suggestedRegion?: string;
  suggestedFocus?: string;
  onShare?: () => void;
  showHint?: boolean;
  onHintDismiss?: () => void;
  className?: string;
}

// Quest insight copy based on progress
const getQuestInsight = (totalPlayed: number, nextThreshold: number): { title: string; body: string; subtext: string } => {
  const remaining = nextThreshold - totalPlayed;
  const progress = totalPlayed / nextThreshold;
  
  if (nextThreshold === 20) {
    if (progress >= 0.6) {
      return {
        title: 'Quest Insight',
        body: 'Most players reach the 20 Club within 18–24 months',
        subtext: "You're ahead of the curve",
      };
    }
    return {
      title: 'Quest Insight',
      body: 'Most players reach the 20 Club within 18–24 months',
      subtext: "You're on track",
    };
  }
  
  if (nextThreshold === 50) {
    return {
      title: 'Quest Insight',
      body: 'The Heritage Club marks serious commitment to the game',
      subtext: remaining <= 15 ? "You're closing in" : "Keep the momentum",
    };
  }
  
  if (nextThreshold === 100) {
    return {
      title: 'Quest Insight',
      body: 'The Century Club is the ultimate achievement for dedicated golfers',
      subtext: remaining <= 25 ? "The finish line is in sight" : "A worthy pursuit",
    };
  }
  
  // Default
  return {
    title: 'Quest Insight',
    body: 'Every course played adds to your legacy',
    subtext: remaining <= 3 ? "One great trip away" : "Keep exploring",
  };
};

export const NextTargetCard: React.FC<NextTargetCardProps> = ({
  totalPlayed,
  nextMilestone,
  recentlyUnlocked,
  suggestedRegion,
  suggestedFocus,
  onShare,
  showHint,
  onHintDismiss,
  className,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [hintVisible, setHintVisible] = React.useState(showHint);
  const [animatedWidth, setAnimatedWidth] = useState(0);

  // Auto-fade hint
  React.useEffect(() => {
    if (showHint && hintVisible) {
      const timer = setTimeout(() => {
        setHintVisible(false);
        onHintDismiss?.();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showHint, hintVisible, onHintDismiss]);

  // Animate progress bar on mount
  useEffect(() => {
    if (nextMilestone && !prefersReducedMotion) {
      const targetWidth = (totalPlayed / nextMilestone.threshold) * 100;
      const timer = setTimeout(() => {
        setAnimatedWidth(Math.min(targetWidth, 100));
      }, 300);
      return () => clearTimeout(timer);
    } else if (nextMilestone) {
      setAnimatedWidth((totalPlayed / nextMilestone.threshold) * 100);
    }
  }, [totalPlayed, nextMilestone, prefersReducedMotion]);

  const remaining = nextMilestone ? nextMilestone.threshold - totalPlayed : 0;
  const insight = nextMilestone ? getQuestInsight(totalPlayed, nextMilestone.threshold) : null;

  // Show recently unlocked celebration
  if (recentlyUnlocked) {
    return (
      <div
        className={cn('p-5 rounded-2xl', className)}
        style={{
          background: 'var(--quest-surface)',
          boxShadow: 'var(--quest-shadow-glow)',
          border: '1px solid rgba(210, 180, 97, 0.25)',
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(210, 180, 97, 0.15)',
              border: '1px solid rgba(210, 180, 97, 0.3)',
            }}
          >
            <Trophy className="w-5 h-5" style={{ color: 'var(--quest-accent-gold)' }} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider" style={{ color: 'var(--quest-accent-gold)' }}>
              Unlocked
            </p>
            <p className="text-lg font-bold" style={{ color: 'var(--quest-text-primary)' }}>
              {recentlyUnlocked}
            </p>
          </div>
        </div>
        
        <button
          onClick={onShare}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-colors"
          style={{
            background: 'rgba(210, 180, 97, 0.12)',
            border: '1px solid rgba(210, 180, 97, 0.2)',
            color: 'var(--quest-accent-gold)',
          }}
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-medium">Share achievement</span>
        </button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {/* Main Target Card */}
      <div
        className="p-5 rounded-2xl"
        style={{
          background: 'var(--quest-surface)',
          border: '1px solid var(--quest-stroke)',
          boxShadow: 'var(--quest-shadow)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4" style={{ color: 'var(--quest-accent-green)' }} />
          <span
            className="text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--quest-text-secondary)' }}
          >
            Next Target
          </span>
        </div>

        {/* Milestone progress */}
        {nextMilestone && (
          <div className="mb-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-lg font-bold" style={{ color: 'var(--quest-text-primary)' }}>
                {nextMilestone.name}
              </span>
              <span
                className="text-base font-semibold"
                style={{ color: 'var(--quest-text-primary)' }}
              >
                {remaining} to go
              </span>
            </div>
            
            {/* Enhanced Progress bar with highlight */}
            <div
              className="h-2.5 rounded-full overflow-hidden relative"
              style={{ background: 'var(--quest-track)' }}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all ease-out",
                  !prefersReducedMotion && "quest-progress-highlight"
                )}
                style={{
                  width: `${animatedWidth}%`,
                  background: 'linear-gradient(90deg, var(--quest-accent-green), var(--quest-accent-gold))',
                  transitionDuration: '650ms',
                }}
              />
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs" style={{ color: 'var(--quest-text-tertiary)' }}>
                {totalPlayed} / {nextMilestone.threshold} courses
              </p>
              {remaining <= 5 && (
                <p className="text-xs font-medium" style={{ color: 'var(--quest-accent-green)' }}>
                  One great trip away
                </p>
              )}
            </div>
            
            {hintVisible && (
              <p
                className="text-xs mt-2 transition-opacity duration-500"
                style={{ color: 'var(--quest-text-tertiary)', fontStyle: 'italic' }}
              >
                This updates as you play more courses
              </p>
            )}
          </div>
        )}

        {/* Suggestions with icons */}
        <div className="space-y-2">
          {suggestedRegion && (
            <div
              className="flex items-center justify-between py-2.5 px-3 rounded-xl"
              style={{ 
                background: 'var(--quest-chip-bg)',
                border: '1px solid var(--quest-chip-stroke)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4" style={{ color: 'var(--quest-accent-green)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--quest-text-secondary)' }}>
                  Suggested region
                </span>
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--quest-text-primary)' }}>
                {suggestedRegion}
              </span>
            </div>
          )}
          
          {suggestedFocus && (
            <div
              className="flex items-center justify-between py-2.5 px-3 rounded-xl"
              style={{ 
                background: 'var(--quest-chip-bg)',
                border: '1px solid var(--quest-chip-stroke)',
              }}
            >
              <div className="flex items-center gap-2.5">
                <Target className="w-4 h-4" style={{ color: 'var(--quest-accent-gold)' }} />
                <span className="text-xs font-medium" style={{ color: 'var(--quest-text-secondary)' }}>
                  Focus on
                </span>
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--quest-text-primary)' }}>
                {suggestedFocus}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Quest Insight Card */}
      {insight && (
        <div
          className="p-4 rounded-xl quest-insight-card"
        >
          <div className="flex items-start gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(110, 146, 119, 0.12)' }}
            >
              <Lightbulb className="w-4 h-4" style={{ color: 'var(--quest-accent-green)' }} />
            </div>
            <div>
              <p className="text-xs font-semibold mb-0.5" style={{ color: 'var(--quest-accent-green)' }}>
                {insight.title}
              </p>
              <p className="text-sm" style={{ color: 'var(--quest-text-primary)' }}>
                {insight.body}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--quest-text-tertiary)' }}>
                {insight.subtext}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NextTargetCard;
