import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { STREAK } from '@/lib/supabase/selects';

export interface StreakData {
  dailyStreak: number;
  weeklyStreak: number;
  monthlyStreak: number;
  lastDailyAction: string | null;
  lastWeeklyAction: string | null;
  lastMonthlyAction: string | null;
  nextReward: {
    type: 'daily' | 'weekly' | 'monthly';
    at: number;
    reward: number;
  } | null;
  daysUntilReset: number;
  isActive: boolean;
}

export function useStreaks(userId?: string) {
  return useQuery({
    queryKey: ['streaks', userId],
    queryFn: async (): Promise<StreakData | null> => {
      if (!userId) return null;

      // Get or create streak record
      let { data: streak, error } = await supabase
        .from('streaks')
        .select('id, user_id, daily_streak, weekly_streak, monthly_streak, last_daily_action, last_weekly_action, last_monthly_action')
        .eq('user_id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      // Create streak record if it doesn't exist
      if (!streak) {
        const { data: newStreak, error: insertError } = await supabase
          .from('streaks')
          .insert({
            user_id: userId,
            daily_streak: 0,
            weekly_streak: 0,
            monthly_streak: 0,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        streak = newStreak;
      }

      // Calculate next reward milestone
      const dailyStreak = streak.daily_streak;
      const nextMilestone = Math.ceil((dailyStreak + 1) / 7) * 7;
      const nextReward = {
        type: 'daily' as const,
        at: nextMilestone,
        reward: Math.floor(nextMilestone / 7) * 50,
      };

      // Calculate days until reset
      const now = new Date();
      const lastAction = streak.last_daily_action ? new Date(streak.last_daily_action) : null;
      const daysSinceAction = lastAction
        ? Math.floor((now.getTime() - lastAction.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      const isActive = daysSinceAction <= 1;

      return {
        dailyStreak: streak.daily_streak,
        weeklyStreak: streak.weekly_streak,
        monthlyStreak: streak.monthly_streak,
        lastDailyAction: streak.last_daily_action,
        lastWeeklyAction: streak.last_weekly_action,
        lastMonthlyAction: streak.last_monthly_action,
        nextReward,
        daysUntilReset: isActive ? 1 : 0,
        isActive,
      };
    },
    enabled: !!userId,
    staleTime: 30_000, // 30 seconds
  });
}
