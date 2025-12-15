/**
 * MilestoneLadder - Grid showing milestone progression (5→400 Club)
 * This is the "Journey Map" showing ONLY milestones, not regional lists
 * Uses AchievementBadgeCard for consistent styling with achievements hub
 */

import React from 'react';
import { CLUB_STEPS } from '@/lib/top100Club';
import { AchievementBadgeCard, AchievementTier } from '@/components/achievements/AchievementBadgeCard';

interface MilestoneLadderProps {
  totalPlayed: number;
  onMilestoneClick?: (milestone: { threshold: number; name: string; isUnlocked: boolean }) => void;
}

// Map threshold to AchievementTier
function getMilestoneTier(threshold: number): AchievementTier {
  return threshold.toString() as AchievementTier;
}

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

      <div className="grid grid-cols-2 gap-3">
        {milestones.map((milestone, index) => {
          const remaining = Math.max(0, milestone.threshold - totalPlayed);
          const isCurrent = index === currentMilestoneIndex;

          return (
            <div
              key={milestone.threshold}
              onClick={() => onMilestoneClick?.(milestone)}
              className="cursor-pointer"
            >
              <AchievementBadgeCard
                tier={getMilestoneTier(milestone.threshold)}
                title={milestone.name}
                subtitle={milestone.tierName}
                unlocked={milestone.isUnlocked}
                isPrimary={isCurrent}
                remaining={milestone.isUnlocked ? undefined : remaining}
                totalTop100Played={milestone.isUnlocked ? totalPlayed : undefined}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default MilestoneLadder;
