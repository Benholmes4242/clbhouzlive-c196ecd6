import { useMemo } from 'react';
import { useTop100ProgressForUser } from './useTop100ProgressForUser';
import { 
  getAllUnlockedAchievements, 
  type AchievementDefinition 
} from '@/lib/achievementDefinitions';

export interface UnlockedAchievement extends AchievementDefinition {
  unlockedAt?: string; // Could be derived from rating dates in future
}

/**
 * Hook to get all unlocked achievements for a user's profile
 * Computes milestone achievements from Top 100 count and list completions from progress
 */
export function useProfileAchievements(userId: string | undefined | null) {
  const { data: progressData, isLoading, error } = useTop100ProgressForUser(userId);

  const achievements = useMemo((): UnlockedAchievement[] => {
    if (!progressData) return [];

    const totalPlayed = progressData.totalTop100Played ?? progressData.total_played_top100 ?? 0;
    const lists = (progressData.lists || []).map(l => ({
      listSlug: l.listSlug,
      played: l.played,
      total: l.total,
    }));

    // Get all unlocked achievements (milestones + list completions)
    const unlocked = getAllUnlockedAchievements(totalPlayed, lists);

    return unlocked;
  }, [progressData]);

  return {
    data: achievements,
    isLoading,
    error,
    totalPlayed: progressData?.totalTop100Played ?? progressData?.total_played_top100 ?? 0,
  };
}
