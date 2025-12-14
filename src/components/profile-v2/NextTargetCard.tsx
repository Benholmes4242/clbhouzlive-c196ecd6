/**
 * NextTargetCard - Smart guidance module for Quest
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Target, Trophy, Share2, Compass, ChevronRight } from 'lucide-react';

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
  const [hintVisible, setHintVisible] = React.useState(showHint);

  // Auto-fade hint after first interaction or timeout
  React.useEffect(() => {
    if (showHint && hintVisible) {
      const timer = setTimeout(() => {
        setHintVisible(false);
        onHintDismiss?.();
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [showHint, hintVisible, onHintDismiss]);
  const remaining = nextMilestone ? nextMilestone.threshold - totalPlayed : 0;
  const progressPercent = nextMilestone
    ? (totalPlayed / nextMilestone.threshold) * 100
    : 100;

  // Show recently unlocked celebration
  if (recentlyUnlocked) {
    return (
      <div
        className={cn(
          'dgp-glass p-5 rounded-2xl',
          className
        )}
        style={{
          boxShadow: '0 0 30px rgba(200, 176, 106, 0.2)',
          border: '1px solid rgba(200, 176, 106, 0.3)',
        }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'rgba(200, 176, 106, 0.2)',
              border: '1px solid var(--dgp-accent-gold)',
            }}
          >
            <Trophy className="w-5 h-5" style={{ color: 'var(--dgp-accent-gold)' }} />
          </div>
          <div>
            <p
              className="text-xs uppercase tracking-wider"
              style={{ color: 'var(--dgp-accent-gold)' }}
            >
              Unlocked
            </p>
            <p
              className="text-lg font-bold"
              style={{ color: 'var(--dgp-text-primary)' }}
            >
              {recentlyUnlocked}
            </p>
          </div>
        </div>
        
        <button
          onClick={onShare}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl transition-colors"
          style={{
            background: 'rgba(200, 176, 106, 0.15)',
            color: 'var(--dgp-accent-gold)',
          }}
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm font-medium">Share achievement</span>
        </button>
      </div>
    );
  }

  // Regular next target view
  return (
    <div
      className={cn(
        'dgp-glass p-5 rounded-2xl',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-4 h-4" style={{ color: 'var(--dgp-accent-green)' }} />
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--dgp-text-secondary)' }}
        >
          Next Target
        </span>
      </div>

      {/* Milestone progress */}
      {nextMilestone && (
        <div className="mb-4">
          <div className="flex items-baseline justify-between mb-2">
            <span
              className="text-lg font-bold"
              style={{ color: 'var(--dgp-text-primary)' }}
            >
              {nextMilestone.name}
            </span>
            <span
              className="text-sm"
              style={{ color: 'var(--dgp-accent-green)' }}
            >
              {remaining} to go
            </span>
          </div>
          
          {/* Progress bar */}
          <div
            className="h-2 rounded-full overflow-hidden"
            style={{ background: 'var(--dgp-glass-surface)' }}
          >
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(progressPercent, 100)}%`,
                background: 'linear-gradient(90deg, var(--dgp-accent-green), var(--dgp-accent-gold))',
              }}
            />
          </div>
          
          <p
            className="text-xs mt-2"
            style={{ color: 'var(--dgp-text-muted)' }}
          >
            {totalPlayed} / {nextMilestone.threshold} courses
          </p>
          {/* Onboarding hint */}
          {hintVisible && (
            <p
              className="text-xs mt-2 transition-opacity duration-500"
              style={{ color: 'var(--dgp-text-muted)', fontStyle: 'italic' }}
            >
              This updates as you play more courses
            </p>
          )}
        </div>
      )}

      {/* Suggestions */}
      <div className="space-y-2">
        {suggestedRegion && (
          <div
            className="flex items-center justify-between py-2 px-3 rounded-lg"
            style={{ background: 'var(--dgp-glass-surface)' }}
          >
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4" style={{ color: 'var(--dgp-accent-blue)' }} />
              <span className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
                Suggested region
              </span>
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--dgp-text-primary)' }}
            >
              {suggestedRegion}
            </span>
          </div>
        )}
        
        {suggestedFocus && (
          <div
            className="flex items-center justify-between py-2 px-3 rounded-lg"
            style={{ background: 'var(--dgp-glass-surface)' }}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" style={{ color: 'var(--dgp-accent-gold)' }} />
              <span className="text-xs" style={{ color: 'var(--dgp-text-muted)' }}>
                Focus on
              </span>
            </div>
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--dgp-text-primary)' }}
            >
              {suggestedFocus}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default NextTargetCard;
