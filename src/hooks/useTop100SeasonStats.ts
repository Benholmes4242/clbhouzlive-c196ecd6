import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Top100SeasonStats = {
  new_top100_this_season: number;
  lists_touched_this_season: number;
  new_by_list: Record<string, number>;
  first_play_dates: string[]; // ISO strings
  lifetime_total_top100: number;
};

type Args = {
  userId?: string | null;
  seasonStart?: string; // ISO
  seasonEnd?: string;   // ISO
};

export function useTop100SeasonStats({
  userId,
  seasonStart,
  seasonEnd,
}: Args = {}) {
  return useQuery({
    queryKey: [
      'top100-season-stats',
      userId ?? 'me',
      seasonStart ?? 'default',
      seasonEnd ?? 'default',
    ],
    queryFn: async (): Promise<Top100SeasonStats | null> => {
      let effectiveUserId = userId;

      if (!effectiveUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        effectiveUserId = user?.id ?? null;
      }

      if (!effectiveUserId) return null;

      const { data, error } = await supabase.rpc(
        'get_top100_season_stats',
        {
          target_user_id: effectiveUserId,
          season_start: seasonStart ?? null,
          season_end: seasonEnd ?? null,
        }
      );

      if (error) throw error;

      const result = data as any;

      return {
        new_top100_this_season: result?.new_top100_this_season ?? 0,
        lists_touched_this_season: result?.lists_touched_this_season ?? 0,
        new_by_list: result?.new_by_list ?? {},
        first_play_dates: result?.first_play_dates ?? [],
        lifetime_total_top100: result?.lifetime_total_top100 ?? 0,
      };
    },
    staleTime: 60_000,
  });
}
