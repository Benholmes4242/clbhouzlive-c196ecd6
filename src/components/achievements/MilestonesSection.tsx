import React from 'react';
import { AchievementBadgeCard, AchievementTier } from './AchievementBadgeCard';
import { MILESTONE_ACHIEVEMENTS } from '@/lib/achievementDefinitions';
import { getTop100Club } from '@/lib/top100Club';

interface MilestonesSectionProps {
  totalTop100Played: number;
}

// Map milestone threshold to AchievementTier
function getMilestoneTier(threshold: number): AchievementTier {
  return threshold.toString() as AchievementTier;
}

export const MilestonesSection: React.FC<MilestonesSectionProps> = ({
  totalTop100Played,
}) => {
  const currentClub = getTop100Club(totalTop100Played);

  return (
    <section className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-semibold">Top 100 Milestones</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {MILESTONE_ACHIEVEMENTS.map((milestone) => {
          const threshold = milestone.threshold ?? 0;
          const isUnlocked = totalTop100Played >= threshold;
          const isCurrent = currentClub.threshold === threshold;

          return (
            <AchievementBadgeCard
              key={milestone.id}
              tier={getMilestoneTier(threshold)}
              title={milestone.shortLabel}
              subtitle={milestone.label}
              unlocked={isUnlocked}
              isPrimary={isCurrent}
            />
          );
        })}
      </div>
    </section>
  );
};

export default MilestonesSection;
