import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ChallengeProgress {
  challengeId: string;
  currentValue: number;
  target: number;
  percent: number;
  isCompleted: boolean;
  completedAt: string | null;
  remainingTime: string;
  daysLeft: number;
  hoursLeft: number;
}

export function useChallengeProgress(challengeId: string, userId?: string) {
  return useQuery({
    queryKey: ['challenge-progress', challengeId, userId],
    queryFn: async (): Promise<ChallengeProgress | null> => {
      if (!userId) return null;

      // Get challenge details with specific columns
      const { data: challenge, error: challengeError } = await supabase
        .from('challenges')
        .select(`
          id, title, description, type, category, xp_reward, shop_currency_reward, start_at, end_at,
          requirements:challenge_requirements(id, metric, target)
        `)
        .eq('id', challengeId)
        .single();

      if (challengeError) throw challengeError;

      // Get user progress with specific columns
      const { data: progress } = await supabase
        .from('user_challenge_progress')
        .select('challenge_id, current_value, is_completed, completed_at')
        .eq('challenge_id', challengeId)
        .eq('user_id', userId)
        .maybeSingle();

      const requirement = challenge.requirements[0];
      const currentValue = progress?.current_value || 0;
      const target = requirement.target;
      const percent = Math.min((currentValue / target) * 100, 100);

      // Calculate remaining time
      const now = new Date();
      const endDate = new Date(challenge.end_at);
      const timeLeft = endDate.getTime() - now.getTime();
      const daysLeft = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hoursLeft = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

      const remainingTime =
        daysLeft > 0
          ? `${daysLeft}d ${hoursLeft}h left`
          : hoursLeft > 0
          ? `${hoursLeft}h left`
          : 'Ending soon';

      return {
        challengeId,
        currentValue,
        target,
        percent,
        isCompleted: progress?.is_completed || false,
        completedAt: progress?.completed_at || null,
        remainingTime,
        daysLeft,
        hoursLeft,
      };
    },
    enabled: !!challengeId && !!userId,
    staleTime: 30_000, // 30 seconds
  });
}
