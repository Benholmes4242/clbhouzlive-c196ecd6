import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type UserTop100Intent = {
  total_top100_played: number;
  played_by_list: Record<string, number>;       // { 'gb-i-top-100': 12, ... }
  recent_course_ids: string[];                  // uuid[]
  wishlist_list_slugs: string[];                // ['gb-i-top-100', ...]
  leaderboard_rank: number | null;
};

export function useUserTop100Intent(userId?: string | null) {
  return useQuery({
    queryKey: ['user-top100-intent', userId ?? 'me'],
    // Always enabled – the query function will early-return if no user
    enabled: true,
    queryFn: async (): Promise<UserTop100Intent | null> => {
      let effectiveUserId = userId;

      if (!effectiveUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        effectiveUserId = user?.id ?? null;
      }

      if (!effectiveUserId) return null;

      const { data, error } = await supabase.rpc('get_user_top100_intent', {
        target_user_id: effectiveUserId,
      });

      if (error) throw error;

      // Type assertion for RPC response
      const result = data as any;

      // Ensure sensible defaults
      return {
        total_top100_played: result?.total_top100_played ?? 0,
        played_by_list: result?.played_by_list ?? {},
        recent_course_ids: result?.recent_course_ids ?? [],
        wishlist_list_slugs: result?.wishlist_list_slugs ?? [],
        leaderboard_rank: result?.leaderboard_rank ?? null,
      };
    },
    staleTime: 60_000,
  });
}
