/**
 * Hook for fetching user streak achievements
 * 
 * Tracks consecutive months of Top 100 course activity and
 * returns streak achievements (Committed, Devoted, Obsessed).
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { StreakAchievement, UserStreak } from '@/types/achievements';

export function useStreakAchievements() {
  const { user } = useSupabaseSession();

  // Fetch user's streak data
  const { data: streakData, isLoading: streakLoading } = useQuery({
    queryKey: ['user-streak', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data as UserStreak | null;
    },
    enabled: !!user?.id,
  });

  // Fetch streak achievements via RPC
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ['streak-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .rpc('get_user_streak_achievements', { p_user_id: user.id });

      if (error) throw error;
      return data as StreakAchievement[];
    },
    enabled: !!user?.id,
  });

  const earnedCount = achievements?.filter(a => a.is_earned).length ?? 0;
  const totalCount = achievements?.length ?? 0;

  return {
    currentStreak: streakData?.current_streak_months ?? 0,
    longestStreak: streakData?.longest_streak_months ?? 0,
    lastActivityMonth: streakData?.last_activity_month,
    currentStreakStart: streakData?.current_streak_start,
    longestStreakStart: streakData?.longest_streak_start,
    longestStreakEnd: streakData?.longest_streak_end,
    achievements: achievements ?? [],
    earnedCount,
    totalCount,
    isLoading: streakLoading || achievementsLoading,
  };
}
