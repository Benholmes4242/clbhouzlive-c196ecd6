import React from 'react';
import { EliteGameCard, type EliteCardTier } from './EliteGameCard';
import { MILESTONE_ACHIEVEMENTS } from '@/lib/achievementDefinitions';
import { getTop100Club } from '@/lib/top100Club';

interface MilestonesSectionProps {
  totalTop100Played: number;
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

          return (
            <EliteGameCard
              key={milestone.id}
              tier={String(threshold) as EliteCardTier}
              earned={isUnlocked}
              currentProgress={totalTop100Played}
              targetProgress={threshold}
              title={milestone.shortLabel}
              subtitle={milestone.label}
              enableAnimations={false}
              quality="medium"
            />
          );
        })}
      </div>
    </section>
  );
};

export default MilestonesSection;
