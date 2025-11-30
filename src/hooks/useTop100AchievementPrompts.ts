import { useMemo } from 'react';
import { useUserAchievements } from './useUserAchievements';
import { useTop100ProgressForUser } from './useTop100ProgressForUser';

export interface Top100AchievementPrompt {
  code: string;
  name: string;
  description: string;
  category: string;
  isUnlocked: boolean;
  playedInList: number;
  totalInList: number;
  progressLabel?: string;
  remainingLabel?: string;
}

export function useTop100AchievementPrompts(listId: string | undefined, userId: string | undefined) {
  const { data: achievements = [] } = useUserAchievements(userId);
  const { data: progressData } = useTop100ProgressForUser(userId);
  const top100Progress = progressData?.lists || [];

  return useMemo(() => {
    if (!listId || !userId) return [];

    const prompts: Top100AchievementPrompt[] = [];

    // Get total Top 100 played across all lists
    const totalTop100Played = top100Progress.reduce((sum, list) => sum + list.played, 0);

    // Top 100 milestone achievements
    const top100Milestones = [
      { code: 'top100_10_club', threshold: 10, name: '10 Club - Top 100', description: 'Play 10 Top 100 courses' },
      { code: 'top100_20_club', threshold: 20, name: '20 Club - Top 100', description: 'Play 20 Top 100 courses' },
      { code: 'top100_50_club', threshold: 50, name: '50 Club - Top 100', description: 'Play 50 Top 100 courses' },
    ];

    top100Milestones.forEach(milestone => {
      const achievement = achievements.find(a => a.code === milestone.code);
      const isUnlocked = achievement?.isUnlocked || false;
      const remaining = Math.max(0, milestone.threshold - totalTop100Played);

      prompts.push({
        code: milestone.code,
        name: milestone.name,
        description: milestone.description,
        category: 'exploration',
        isUnlocked,
        playedInList: totalTop100Played,
        totalInList: milestone.threshold,
        progressLabel: `${totalTop100Played} / ${milestone.threshold}`,
        remainingLabel: remaining > 0 && remaining <= 3 
          ? `You're close! Play ${remaining} more to unlock this.`
          : undefined,
      });
    });

    // List-specific completion (if applicable)
    const currentListProgress = top100Progress.find(list => list.listId === listId);
    if (currentListProgress) {
      const listCompletion = {
        code: `complete_${currentListProgress.listSlug}`,
        name: `${currentListProgress.listName} Completed`,
        description: `Play all courses in the ${currentListProgress.listName}`,
        category: 'exploration',
        isUnlocked: currentListProgress.played === currentListProgress.total,
        playedInList: currentListProgress.played,
        totalInList: currentListProgress.total,
        progressLabel: `${currentListProgress.played} / ${currentListProgress.total}`,
        remainingLabel: undefined,
      };

      const remaining = currentListProgress.total - currentListProgress.played;
      if (remaining > 0 && remaining <= 3) {
        listCompletion.remainingLabel = `You're close! Play ${remaining} more to complete this list.`;
      }

      if (!listCompletion.isUnlocked || remaining <= 5) {
        prompts.push(listCompletion);
      }
    }

    // Return up to 3 prompts
    return prompts
      .sort((a, b) => {
        if (a.isUnlocked !== b.isUnlocked) return a.isUnlocked ? -1 : 1;
        return 0;
      })
      .slice(0, 3);
  }, [listId, userId, achievements, top100Progress]);
}
