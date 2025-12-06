import React from 'react';
import { AchievementBadgeCard } from './AchievementBadgeCard';
import { MILESTONE_ACHIEVEMENTS } from '@/lib/achievementDefinitions';

interface MilestonesSectionProps {
  totalTop100Played: number;
}

export const MilestonesSection: React.FC<MilestonesSectionProps> = ({
  totalTop100Played,
}) => {
  return (
    <section className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-semibold text-slate-900">Top 100 Milestones</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {MILESTONE_ACHIEVEMENTS.map((milestone) => {
          const threshold = milestone.threshold ?? 0;
          const isUnlocked = totalTop100Played >= threshold;

          return (
            <AchievementBadgeCard
              key={milestone.id}
              title={milestone.shortLabel}
              subtitle={milestone.label}
              status={isUnlocked ? 'UNLOCKED' : 'LOCKED'}
              type="MILESTONE"
              accentColor={milestone.ringColor}
            />
          );
        })}
      </div>
    </section>
  );
};

export default MilestonesSection;
