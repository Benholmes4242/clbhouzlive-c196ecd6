import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'weekly' | 'monthly' | 'personal' | 'regional' | 'global';
  category: 'exploration' | 'skill' | 'social';
  xp_reward: number;
  shop_currency_reward: number;
  start_at: string;
  end_at: string;
  requirements: {
    id: string;
    metric: string;
    target: number;
  }[];
  progress?: {
    current_value: number;
    is_completed: boolean;
    completed_at: string | null;
  };
}

export function useActiveChallenges(userId?: string) {
  return useQuery({
    queryKey: ['active-challenges', userId],
    queryFn: async (): Promise<Challenge[]> => {
      const now = new Date().toISOString();

      // Fetch active challenges with specific columns
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select(`
          id, title, description, type, category, xp_reward, shop_currency_reward, start_at, end_at,
          requirements:challenge_requirements(id, metric, target)
        `)
        .eq('is_active', true)
        .lte('start_at', now)
        .gte('end_at', now)
        .order('type', { ascending: true });

      if (error) throw error;

      if (!userId) return challenges as Challenge[];

      // Fetch user progress for these challenges
      const challengeIds = challenges.map(c => c.id);
      const { data: progress } = await supabase
        .from('user_challenge_progress')
        .select('challenge_id, current_value, is_completed, completed_at')
        .eq('user_id', userId)
        .in('challenge_id', challengeIds);

      // Merge progress with challenges
      return challenges.map(challenge => ({
        ...challenge,
        progress: progress?.find(p => p.challenge_id === challenge.id),
      })) as Challenge[];
    },
    enabled: true,
    staleTime: 60_000, // 1 minute
  });
}
