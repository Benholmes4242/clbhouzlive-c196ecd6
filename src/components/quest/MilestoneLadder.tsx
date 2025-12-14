/**
 * MilestoneLadder - Vertical timeline showing milestone progression (5→400 Club)
 * This is the "Journey Map" showing ONLY milestones, not regional lists
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Lock, Trophy } from 'lucide-react';
import { CLUB_STEPS } from '@/lib/top100Club';
import { getRingColorForThreshold } from '@/lib/globalAchievementMilestoneSystem';

interface MilestoneLadderProps {
  totalPlayed: number;
  onMilestoneClick?: (milestone: { threshold: number; name: string; isUnlocked: boolean }) => void;
}

interface MilestoneNodeProps {
  threshold: number;
  name: string;
  tierName: string;
  isUnlocked: boolean;
  isCurrent: boolean;
  isLast: boolean;
  totalPlayed: number;
  onClick?: () => void;
}

const MilestoneNode: React.FC<MilestoneNodeProps> = ({
  threshold,
  name,
  tierName,
  isUnlocked,
  isCurrent,
  isLast,
  totalPlayed,
  onClick,
}) => {
  const progressPercent = isCurrent 
    ? Math.min((totalPlayed / threshold) * 100, 100) 
    : isUnlocked ? 100 : 0;
  const remaining = threshold - totalPlayed;
  const ringColor = getRingColorForThreshold(threshold);

  return (
    <div className="relative flex items-start gap-4">
      {/* Connecting line */}
      {!isLast && (
        <div
          className="absolute left-5 top-10 w-0.5 h-full"
          style={{
            background: isUnlocked
              ? `linear-gradient(to bottom, ${ringColor}, var(--dgp-divider))`
              : 'var(--dgp-divider)',
            opacity: isUnlocked ? 0.8 : 0.3,
          }}
        />
      )}

      {/* Node indicator */}
      <button
        onClick={onClick}
      className={cn(
        'relative z-10 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300',
        isUnlocked && 'ring-2 ring-offset-2 ring-offset-[#0B0F0D]',
        isCurrent && !isUnlocked && 'ring-1 ring-offset-1 ring-offset-[#0B0F0D]',
      )}
      style={{
        background: isUnlocked
          ? ringColor
          : isCurrent
          ? 'var(--dgp-accent-green)'
          : 'var(--dgp-glass-surface)',
        border: `2px solid ${
          isUnlocked
            ? ringColor
            : isCurrent
            ? 'var(--dgp-accent-green)'
            : 'var(--dgp-glass-stroke)'
        }`,
        boxShadow: isUnlocked
          ? `0 0 20px ${ringColor}40`
          : isCurrent
          ? 'var(--dgp-shadow-glow-green)'
          : 'none',
        // @ts-expect-error CSS custom property for ring color
        '--tw-ring-color': isUnlocked ? ringColor : isCurrent ? 'var(--dgp-accent-green)' : undefined,
      }}
    >
        {isUnlocked ? (
          <Check className="w-5 h-5 text-black" />
        ) : isCurrent ? (
          <Trophy className="w-4 h-4" style={{ color: 'var(--dgp-text-primary)' }} />
        ) : (
          <Lock className="w-4 h-4" style={{ color: 'var(--dgp-text-muted)' }} />
        )}

        {/* Pulse for current */}
        {isCurrent && !isUnlocked && (
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              background: 'var(--dgp-accent-green)',
              opacity: 0.25,
              animationDuration: '2s',
            }}
          />
        )}
      </button>

      {/* Milestone card */}
      <button
        onClick={onClick}
        className={cn(
          'flex-1 dgp-glass p-4 rounded-xl text-left transition-all duration-200 mb-4',
          'hover:border-white/15 active:scale-[0.98]',
          !isUnlocked && !isCurrent && 'opacity-50',
        )}
        style={{
          boxShadow: isUnlocked
            ? `0 0 20px ${ringColor}20`
            : isCurrent
            ? '0 0 15px rgba(110, 146, 119, 0.15)'
            : 'none',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--dgp-text-primary)' }}
          >
            {name}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: isUnlocked
                ? `${ringColor}33`
                : isCurrent
                ? 'rgba(110, 146, 119, 0.2)'
                : 'var(--dgp-glass-surface)',
              color: isUnlocked
                ? ringColor
                : isCurrent
                ? 'var(--dgp-accent-green)'
                : 'var(--dgp-text-muted)',
            }}
          >
            {isUnlocked ? 'Unlocked' : isCurrent ? 'In Progress' : 'Locked'}
          </span>
        </div>

        <p
          className="text-xs mb-3"
          style={{ color: 'var(--dgp-text-muted)' }}
        >
          {tierName}
        </p>

        {/* Progress info */}
        {isCurrent && !isUnlocked && (
          <>
            <div className="flex items-baseline justify-between mb-2">
              <span
                className="text-lg font-bold"
                style={{ color: 'var(--dgp-text-primary)' }}
              >
                {totalPlayed}
                <span className="text-sm font-normal" style={{ color: 'var(--dgp-text-muted)' }}>
                  {' '}/ {threshold}
                </span>
              </span>
              <span
                className="text-xs"
                style={{ color: 'var(--dgp-accent-green)' }}
              >
                {remaining} to go
              </span>
            </div>

            {/* Progress bar */}
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: 'var(--dgp-glass-surface)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, var(--dgp-accent-green), var(--dgp-accent-gold))',
                }}
              />
            </div>
          </>
        )}

        {/* Unlocked - show full bar */}
        {isUnlocked && (
          <div
            className="h-1.5 rounded-full overflow-hidden"
            style={{ background: 'var(--dgp-glass-surface)' }}
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
  // Build milestones from CLUB_STEPS
  const milestones = CLUB_STEPS.map(step => ({
    threshold: step.threshold,
    name: `${step.threshold} Club`,
    tierName: step.tierName,
    isUnlocked: totalPlayed >= step.threshold,
  }));

  // Find current milestone (first not unlocked)
  const currentMilestoneIndex = milestones.findIndex(m => !m.isUnlocked);

  return (
    <section>
      <h2
        className="text-sm font-semibold uppercase tracking-wider mb-4 px-1"
        style={{ color: 'var(--dgp-text-secondary)' }}
      >
        Journey Map
      </h2>

      <div className="relative pl-2">
        {/* Background path line */}
        <div
          className="absolute left-7 top-0 bottom-0 w-0.5"
          style={{ background: 'var(--dgp-divider)' }}
        />

        <div className="space-y-0">
          {milestones.map((milestone, index) => (
            <MilestoneNode
              key={milestone.threshold}
              threshold={milestone.threshold}
              name={milestone.name}
              tierName={milestone.tierName}
              isUnlocked={milestone.isUnlocked}
              isCurrent={index === currentMilestoneIndex}
              isLast={index === milestones.length - 1}
              totalPlayed={totalPlayed}
              onClick={() => onMilestoneClick?.(milestone)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default MilestoneLadder;
