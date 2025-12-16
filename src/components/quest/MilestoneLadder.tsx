/**
 * MilestoneLadder - Vertical timeline showing milestone progression (5→400 Club)
 * This is the "Journey Map" showing ONLY milestones, not regional lists
 * Light theme version
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
          className="absolute left-5 top-10 w-0.5 h-full journey-rail"
          style={{
            background: isUnlocked
              ? `linear-gradient(to bottom, ${ringColor}, rgba(31, 36, 40, 0.16))`
              : 'rgba(31, 36, 40, 0.16)',
            opacity: isUnlocked ? 0.7 : 0.5,
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
            ? `0 0 12px ${ringColor}25`
            : isCurrent
            ? '0 0 10px rgba(110, 146, 119, 0.15)'
            : 'var(--quest-shadow-sm)',
          // @ts-expect-error CSS custom property for ring color
          '--tw-ring-color': isUnlocked ? ringColor : isCurrent ? 'var(--quest-accent-green)' : undefined,
        }}
      >
        {isUnlocked ? (
          <Check className="w-5 h-5 text-white" />
        ) : isCurrent ? (
          <Trophy className="w-4 h-4 text-white" />
        ) : (
          <Lock className="w-4 h-4" style={{ color: 'var(--quest-text-tertiary)' }} />
        )}

        {/* Pulse for current - reduced for light theme */}
        {isCurrent && !isUnlocked && (
          <div
            className="absolute inset-0 rounded-full animate-ping journey-node-glow"
            style={{
              background: 'var(--quest-accent-green)',
              opacity: 0.12,
              animationDuration: '2s',
            }}
          />
        )}
      </button>

      {/* Milestone card */}
      <button
        onClick={onClick}
        className={cn(
          'flex-1 p-4 rounded-xl text-left transition-all duration-200 mb-4',
          'hover:shadow-md active:scale-[0.98]',
          !isUnlocked && !isCurrent && 'opacity-60',
        )}
        style={{
          background: 'var(--quest-card)',
          border: '1px solid var(--quest-stroke)',
          boxShadow: isUnlocked
            ? `0 0 12px ${ringColor}10`
            : isCurrent
            ? '0 0 10px rgba(110, 146, 119, 0.08)'
            : 'var(--quest-shadow-sm)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-sm font-semibold"
            style={{ color: 'var(--quest-text-primary)' }}
          >
            {name}
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: isUnlocked
                ? `${ringColor}18`
                : isCurrent
                ? 'rgba(247, 147, 30, 0.16)'
                : 'var(--quest-pill-inactive)',
              border: isUnlocked
                ? `1px solid ${ringColor}35`
                : isCurrent
                ? '1px solid rgba(247, 147, 30, 0.26)'
                : '1px solid var(--quest-stroke)',
              color: isUnlocked
                ? ringColor
                : isCurrent
                ? 'var(--quest-text-primary)'
                : 'var(--quest-text-tertiary)',
            }}
          >
            {isUnlocked ? 'Unlocked' : isCurrent ? 'In Progress' : 'Locked'}
          </span>
        </div>

        <p
          className="text-xs mb-3"
          style={{ color: 'var(--quest-text-tertiary)' }}
        >
          {tierName}
        </p>

        {/* Progress info */}
        {isCurrent && !isUnlocked && (
          <>
            <div className="flex items-baseline justify-between mb-2">
              <span
                className="text-lg font-bold"
                style={{ color: 'var(--quest-text-primary)' }}
              >
                {totalPlayed}
                <span className="text-sm font-normal" style={{ color: 'var(--quest-text-tertiary)' }}>
                  {' '}/ {threshold}
                </span>
              </span>
              <span
                className="text-xs"
                style={{ color: 'var(--quest-accent-green)' }}
              >
                {remaining} to go
              </span>
            </div>

            {/* Progress bar */}
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: 'var(--quest-track)' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${progressPercent}%`,
                  background: 'linear-gradient(90deg, var(--quest-accent-green), var(--quest-accent-gold))',
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
        className="text-sm font-semibold uppercase tracking-wider mb-4 px-1 quest-section-title"
        style={{ color: 'var(--quest-text-secondary)' }}
      >
        Journey Map
      </h2>

      <div className="relative pl-2">
        {/* Background path line */}
        <div
          className="absolute left-7 top-0 bottom-0 w-0.5 journey-rail"
          style={{ background: 'rgba(31, 36, 40, 0.16)' }}
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
