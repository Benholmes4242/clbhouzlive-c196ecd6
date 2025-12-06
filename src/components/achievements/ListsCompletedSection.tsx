import React from 'react';
import { AchievementBadgeCard } from './AchievementBadgeCard';
import { LIST_ACHIEVEMENTS, LIST_SLUG_TO_ACHIEVEMENT_ID } from '@/lib/achievementDefinitions';

interface ListProgress {
  listSlug: string;
  played: number;
  total: number;
}

interface ListsCompletedSectionProps {
  lists: ListProgress[];
}

export const ListsCompletedSection: React.FC<ListsCompletedSectionProps> = ({
  lists,
}) => {
  // Build a set of completed list achievement IDs
  const completedListIds = new Set<string>();
  for (const list of lists) {
    if (list.played >= list.total && list.total > 0) {
      const achievementId = LIST_SLUG_TO_ACHIEVEMENT_ID[list.listSlug];
      if (achievementId) {
        completedListIds.add(achievementId);
      }
    }
  }

  return (
    <section className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-semibold text-slate-900">Top 100 Lists Completed</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {LIST_ACHIEVEMENTS.map((listAchievement) => {
          const isUnlocked = completedListIds.has(listAchievement.id);

          return (
            <AchievementBadgeCard
              key={listAchievement.id}
              title={listAchievement.shortLabel}
              subtitle={listAchievement.label}
              status={isUnlocked ? 'UNLOCKED' : 'LOCKED'}
              type="LIST"
              accentColor={listAchievement.ringColor}
            />
          );
        })}
      </div>
    </section>
  );
};

export default ListsCompletedSection;
