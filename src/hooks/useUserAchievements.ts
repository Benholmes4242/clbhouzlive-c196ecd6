import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserAchievement {
  achievementId: string;
  code: string;
  name: string;
  description: string;
  category: 'skill' | 'exploration' | 'social' | string;
  points: number;
  isUnlocked: boolean;
  unlockedAt?: string | null;
}

export function useUserAchievements(userId?: string) {
  return useQuery({
    queryKey: ['user-achievements', userId],
    enabled: !!userId,
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_achievements_view' as any)
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      return (data || []).map((row: any): UserAchievement => ({
        achievementId: row.achievement_id,
        code: row.code,
        name: row.name,
        description: row.description,
        category: row.category,
        points: row.points ?? 0,
        isUnlocked: !!row.is_unlocked,
        unlockedAt: row.unlocked_at,
      }));
    },
    staleTime: 60_000,
  });
}
