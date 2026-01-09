import React from 'react';
import { EliteGameCard, EliteCardTier } from './EliteGameCard';
import { LIST_ACHIEVEMENTS, LIST_SLUG_TO_ACHIEVEMENT_ID } from '@/lib/achievementDefinitions';

interface ListProgress {
  listSlug: string;
  played: number;
  total: number;
}

interface ListsCompletedSectionProps {
  lists: ListProgress[];
}

// Map list ID to EliteCardTier
function getListTier(id: string): EliteCardTier {
  if (id === 'list_gb_ireland') return 'GBI';
  if (id === 'list_europe') return 'EU';
  if (id === 'list_usa') return 'USA';
  if (id === 'list_worldwide') return 'WORLD';
  return 'WORLD';
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

  // Get progress for each list
  const getListProgress = (listId: string) => {
    const listSlugMap: Record<string, string> = {
      'list_gb_ireland': 'gb-i',
      'list_europe': 'europe',
      'list_usa': 'usa',
      'list_worldwide': 'global',
    };
    const slug = listSlugMap[listId];
    return lists.find(l => l.listSlug === slug);
  };

  return (
    <section className="mb-6 md:mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-base md:text-lg font-semibold">Top 100 Lists Completed</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {LIST_ACHIEVEMENTS.map((listAchievement) => {
          const isUnlocked = completedListIds.has(listAchievement.id);
          const progress = getListProgress(listAchievement.id);

          return (
            <EliteGameCard
              key={listAchievement.id}
              tier={getListTier(listAchievement.id)}
              earned={isUnlocked}
              currentProgress={progress?.played ?? 0}
              targetProgress={progress?.total ?? 100}
              title={listAchievement.shortLabel}
              subtitle={listAchievement.label}
            />
          );
        })}
      </div>
    </section>
  );
};

export default ListsCompletedSection;
