/**
 * MilestoneLadder - Vertical timeline showing milestone progression (5→400 Club)
 * This is the "Journey Map" showing ONLY milestones, not regional lists
 * Uses AchievementBadgeCard for consistent styling with achievements hub
 */

import React from 'react';
import { cn } from '@/lib/utils';
import { Check, Lock, Trophy } from 'lucide-react';
import { CLUB_STEPS } from '@/lib/top100Club';
import { getRingColorForThreshold } from '@/lib/globalAchievementMilestoneSystem';
import { AchievementBadgeCard, AchievementTier } from '@/components/achievements/AchievementBadgeCard';

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

// Map threshold to AchievementTier
function getMilestoneTier(threshold: number): AchievementTier {
  return threshold.toString() as AchievementTier;
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
  const ringColor = getRingColorForThreshold(threshold);
  const remaining = Math.max(0, threshold - totalPlayed);

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

      {/* Milestone card - using AchievementBadgeCard */}
      <div className="flex-1 mb-4" onClick={onClick}>
        <AchievementBadgeCard
          tier={getMilestoneTier(threshold)}
          title={name}
          subtitle={tierName}
          unlocked={isUnlocked}
          isPrimary={isCurrent}
          remaining={isUnlocked ? undefined : remaining}
          totalTop100Played={isUnlocked ? totalPlayed : undefined}
        />
      </div>
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
