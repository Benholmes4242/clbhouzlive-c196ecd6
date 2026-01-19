/**
 * Hook for fetching user combination achievements
 * 
 * Tracks progress toward thematic course collections:
 * - Links Lover (10 links courses)
 * - Parkland Pioneer (10 parkland courses)
 * - Island Hopper (5 different countries)
 * - Major Hunter (5 major championship venues)
 * - Home Nations (England, Scotland, Wales, Ireland)
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import type { CombinationAchievement } from '@/types/achievements';

export function useCombinationAchievements() {
  const { user } = useSupabaseSession();

  const { data: achievements, isLoading, error } = useQuery({
    queryKey: ['combination-achievements', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .rpc('get_user_combination_achievements', { p_user_id: user.id });

      if (error) throw error;
      return data as CombinationAchievement[];
    },
    enabled: !!user?.id,
  });

  const earnedCount = achievements?.filter(a => a.is_earned).length ?? 0;
  const totalCount = achievements?.length ?? 0;

  return {
    achievements: achievements ?? [],
    earnedCount,
    totalCount,
    isLoading,
    error,
  };
}
