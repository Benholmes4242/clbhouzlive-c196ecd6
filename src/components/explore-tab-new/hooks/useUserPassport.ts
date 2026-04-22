import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserPassportRow {
  courses_played: number;
  countries_played: number;
  avg_rating_given: number | null;
  reviews_written: number;
  top_100_played: number;
  wishlist_count: number;
  friends_courses_to_try: number;
  first_play_year: number | null;
}

export function useUserPassport(userId: string | undefined) {
  return useQuery({
    queryKey: ['user-passport', userId],
    enabled: !!userId,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    queryFn: async (): Promise<UserPassportRow | null> => {
      const { data, error } = await supabase.rpc('get_user_passport', {
        p_user_id: userId!,
      } as any);
      if (error) {
        console.error('[useUserPassport] RPC error:', error);
        if (import.meta.env.DEV) throw error;
        return null;
      }
      const row = Array.isArray(data) ? data[0] : null;
      return (row as UserPassportRow) ?? null;
    },
  });
}

