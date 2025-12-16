/**
 * MilestoneLadder - Premium vertical timeline (5→400 Club)
 * Features: Premium rail, flavour text, unlock celebration
 */

import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Check, Lock, Trophy } from 'lucide-react';
import { CLUB_STEPS } from '@/lib/top100Club';
import { getRingColorForThreshold } from '@/lib/globalAchievementMilestoneSystem';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface MilestoneLadderProps {
  totalPlayed: number;
  onMilestoneClick?: (milestone: { threshold: number; name: string; isUnlocked: boolean }) => void;
}

// Flavour text for each milestone tier
const MILESTONE_FLAVOUR: Record<number, string> = {
  5: 'Your journey begins',
  10: 'Momentum builds',
  20: "You're officially committed",
  50: 'A golfer of taste',
  100: 'Proper legacy',
  200: 'Among the elite',
  300: 'A legendary pursuit',
  400: 'The ultimate achievement',
};

interface MilestoneNodeProps {
  threshold: number;
  name: string;
  tierName: string;
  flavourText: string;
  isUnlocked: boolean;
  isCurrent: boolean;
  isLast: boolean;
  totalPlayed: number;
  index: number;
  onClick?: () => void;
}

const MilestoneNode: React.FC<MilestoneNodeProps> = ({
  threshold,
  name,
  tierName,
  flavourText,
  isUnlocked,
  isCurrent,
  isLast,
  totalPlayed,
  index,
  onClick,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [animatedWidth, setAnimatedWidth] = useState(0);
  
  const progressPercent = isCurrent 
    ? Math.min((totalPlayed / threshold) * 100, 100) 
    : isUnlocked ? 100 : 0;
  const remaining = threshold - totalPlayed;
  const ringColor = getRingColorForThreshold(threshold);

  // Animate progress bar for current milestone
  useEffect(() => {
    if (isCurrent && !prefersReducedMotion) {
      const timer = setTimeout(() => {
        setAnimatedWidth(progressPercent);
      }, 400 + index * 80);
      return () => clearTimeout(timer);
    } else {
      setAnimatedWidth(progressPercent);
    }
  }, [isCurrent, progressPercent, prefersReducedMotion, index]);

  return (
    <div 
      className={cn(
        "relative flex items-start gap-4",
        !prefersReducedMotion && "quest-animate-fade-up"
      )}
      style={{ 
        animationDelay: prefersReducedMotion ? '0ms' : `${200 + index * 60}ms` 
      }}
    >
      {/* Connecting line - premium gradient */}
      {!isLast && (
        <div
          className="absolute left-5 top-10 w-0.5 h-full"
          style={{
            background: isUnlocked
              ? `linear-gradient(to bottom, ${ringColor}, ${ringColor}40 70%, rgba(31, 36, 40, 0.08))`
              : 'linear-gradient(to bottom, rgba(31, 36, 40, 0.12), rgba(31, 36, 40, 0.04))',
          }}
        />
      )}

      {/* Node indicator */}
      <button
        onClick={onClick}
        className={cn(
          'relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300',
          isUnlocked && 'ring-2 ring-offset-2 ring-offset-[#F4F5F7]',
          isCurrent && !isUnlocked && 'ring-1 ring-offset-1 ring-offset-[#F4F5F7]',
        )}
        style={{
          background: isUnlocked
            ? ringColor
            : isCurrent
            ? 'var(--quest-accent-green)'
            : 'var(--quest-card)',
          border: `2px solid ${
            isUnlocked
              ? ringColor
              : isCurrent
              ? 'var(--quest-accent-green)'
              : 'var(--quest-stroke)'
          }`,
          boxShadow: isUnlocked
            ? `0 0 16px ${ringColor}30`
            : isCurrent
            ? '0 0 12px rgba(110, 146, 119, 0.2)'
            : 'var(--quest-shadow-sm)',
          // @ts-expect-error CSS custom property for ring color
          '--tw-ring-color': isUnlocked ? ringColor : isCurrent ? 'var(--quest-accent-green)' : undefined,
        }}
      >
        {isUnlocked ? (
          <Check className="w-5 h-5 text-white" strokeWidth={2.5} />
        ) : isCurrent ? (
          <Trophy className="w-4 h-4 text-white" />
        ) : (
          <Lock className="w-4 h-4" style={{ color: 'var(--quest-text-tertiary)', opacity: 0.6 }} />
        )}

        {/* Pulse for current - subtle */}
        {isCurrent && !isUnlocked && !prefersReducedMotion && (
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'var(--quest-accent-green)',
              animation: 'quest-node-pulse 2.5s ease-out infinite',
            }}
          />
        )}
      </button>

      {/* Milestone card */}
      <button
        onClick={onClick}
        className={cn(
          'flex-1 p-4 rounded-xl text-left transition-all duration-200 mb-4',
          'hover:shadow-md active:scale-[0.99]',
          !isUnlocked && !isCurrent && 'opacity-50',
        )}
        style={{
          background: 'var(--quest-card)',
          border: `1px solid ${isUnlocked ? `${ringColor}30` : isCurrent ? 'rgba(247, 147, 30, 0.2)' : 'var(--quest-stroke)'}`,
          boxShadow: isUnlocked
            ? `0 0 16px ${ringColor}12`
            : isCurrent
            ? '0 0 12px rgba(247, 147, 30, 0.08)'
            : 'var(--quest-shadow-sm)',
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold" style={{ color: 'var(--quest-text-primary)' }}>
            {name}
          </span>
          <span
            className={cn(
              "text-xs px-2.5 py-1 rounded-full font-medium",
              isUnlocked && "quest-status-pill is-unlocked",
              isCurrent && "quest-status-pill is-in-progress",
              !isUnlocked && !isCurrent && "quest-status-pill"
            )}
          >
            {isUnlocked ? 'Unlocked' : isCurrent ? 'In Progress' : 'Locked'}
          </span>
        </div>

        <p className="text-xs mb-1" style={{ color: 'var(--quest-text-tertiary)' }}>
          {tierName}
        </p>

        {/* Flavour text */}
        <p className="text-xs italic mb-3" style={{ color: 'var(--quest-text-tertiary)', opacity: 0.8 }}>
          "{flavourText}"
        </p>

        {/* Progress info for current */}
        {isCurrent && !isUnlocked && (
          <>
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-lg font-bold" style={{ color: 'var(--quest-text-primary)' }}>
                {totalPlayed}
                <span className="text-sm font-normal" style={{ color: 'var(--quest-text-tertiary)' }}>
                  {' '}/ {threshold}
                </span>
              </span>
              <span className="text-xs font-medium" style={{ color: 'var(--quest-accent-green)' }}>
                {remaining} to go
              </span>
            </div>

            {/* Animated progress bar */}
            <div
              className="h-1.5 rounded-full overflow-hidden"
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
          </>
        )}

        {/* Unlocked - show full bar */}
        {isUnlocked && (
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--quest-track)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: '100%',
                background: ringColor,
              }}
            />
          </div>
        )}
      </button>
    </div>
  );
};

export const MilestoneLadder: React.FC<MilestoneLadderProps> = ({
  totalPlayed,
  onMilestoneClick,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Build milestones from CLUB_STEPS
  const milestones = CLUB_STEPS.map(step => ({
    threshold: step.threshold,
    name: `${step.threshold} Club`,
    tierName: step.tierName,
    flavourText: MILESTONE_FLAVOUR[step.threshold] || '',
    isUnlocked: totalPlayed >= step.threshold,
  }));

  // Find current milestone (first not unlocked)
  const currentMilestoneIndex = milestones.findIndex(m => !m.isUnlocked);

  return (
    <section>
      <h2
        className={cn(
          "quest-section-title mb-4 px-1",
          isVisible && !prefersReducedMotion && "quest-animate-fade-up"
        )}
        style={{ animationDelay: '150ms' }}
      >
        Journey Map
      </h2>

      <div className="relative pl-2">
        {/* Background path line - gradient fade */}
        <div
          className="absolute left-7 top-0 bottom-0 w-0.5"
          style={{ 
            background: 'linear-gradient(to bottom, rgba(31, 36, 40, 0.12) 0%, rgba(31, 36, 40, 0.04) 100%)' 
          }}
        />

        <div className="space-y-0">
          {milestones.map((milestone, index) => (
            <MilestoneNode
              key={milestone.threshold}
              threshold={milestone.threshold}
              name={milestone.name}
              tierName={milestone.tierName}
              flavourText={milestone.flavourText}
              isUnlocked={milestone.isUnlocked}
              isCurrent={index === currentMilestoneIndex}
              isLast={index === milestones.length - 1}
              totalPlayed={totalPlayed}
              index={index}
              onClick={() => onMilestoneClick?.(milestone)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MilestoneLadder;
