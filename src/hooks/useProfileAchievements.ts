import { useMemo } from 'react';
import { useTop100ProgressForUser } from './useTop100ProgressForUser';
import { 
  getAllUnlockedAchievements, 
  ALL_ACHIEVEMENTS,
  type AchievementDefinition 
} from '@/lib/achievementDefinitions';
import { DEBUG_UNLOCK_ALL_ACHIEVEMENTS, DEBUG_ACHIEVEMENTS_USER_EMAIL } from '@/utils/featureFlags';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';

export interface UnlockedAchievement extends AchievementDefinition {
  unlockedAt?: string; // Could be derived from rating dates in future
}

/**
 * Hook to get all unlocked achievements for a user's profile
 * Computes milestone achievements from Top 100 count and list completions from progress
 */
export function useProfileAchievements(userId: string | undefined | null) {
  const { data: progressData, isLoading: queryLoading, error } = useTop100ProgressForUser(userId);
  const { user } = useSupabaseSession();

  // Consider loading if userId is falsy (waiting for user data) or if query is loading
  const isLoading = !userId || queryLoading;

  // Check if debug mode should apply (only for Benjamin Holmes)
  const isDebugUser = DEBUG_UNLOCK_ALL_ACHIEVEMENTS && user?.email === DEBUG_ACHIEVEMENTS_USER_EMAIL;

  const achievements = useMemo((): UnlockedAchievement[] => {
    // DEBUG MODE: Return all achievements as unlocked for Benjamin Holmes
    if (isDebugUser) {
      return ALL_ACHIEVEMENTS.map(ach => ({
        ...ach,
        unlockedAt: new Date().toISOString(),
      }));
    }

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
  }, [progressData, isDebugUser]);

  // In debug mode, show high total played count
  const debugTotalPlayed = isDebugUser ? 400 : (progressData?.totalTop100Played ?? progressData?.total_played_top100 ?? 0);

  return {
    data: achievements,
    isLoading,
    error,
    totalPlayed: debugTotalPlayed,
  };
}
