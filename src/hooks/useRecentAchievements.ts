import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface RecentAchievement {
  achievementId: string;
  unlockedAt: string;
  sourceContext?: any;
  code: string;
  name: string;
  description: string;
  category: string;
  points: number;
}

export function useRecentAchievements(userId?: string, limit = 5) {
  return useQuery({
    queryKey: ['user-achievements-recent', userId, limit],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_achievements' as any)
        .select(
          `
          achievement_id,
          unlocked_at,
          source_context,
          achievements (
            code,
            name,
            description,
            category,
            points
          )
        `
        )
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map((row: any): RecentAchievement => ({
        achievementId: row.achievement_id,
        unlockedAt: row.unlocked_at,
        sourceContext: row.source_context,
        code: row.achievements?.code ?? '',
        name: row.achievements?.name ?? '',
        description: row.achievements?.description ?? '',
        category: row.achievements?.category ?? '',
        points: row.achievements?.points ?? 0,
      }));
    },
    staleTime: 30_000,
  });
}
