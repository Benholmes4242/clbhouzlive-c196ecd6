import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { quarterOf } from '@/lib/gam/seasonClock';

/**
 * Count of verified rounds the user has in the given quarter. Reads
 * gam_round_stats -- the same table the evaluator uses to award the
 * seasonal medal, so the client and server share one definition of
 * "verified round".
 */
export function useSeasonRoundCount(
  userId: string | null | undefined,
  year: number,
  quarter: number,
) {
  return useQuery<number>({
    queryKey: ['gam', 'season-round-count', userId, year, quarter],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { startDate, endDate } = quarterOf(new Date(Date.UTC(year, (quarter - 1) * 3, 1)));
      const startIso = startDate.toISOString().slice(0, 10);
      const endIso = endDate.toISOString().slice(0, 10);
      const { count, error } = await supabase
        .from('gam_round_stats')
        .select('whs_score_id', { count: 'exact', head: true })
        .eq('user_id', userId!)
        .gte('play_date', startIso)
        .lt('play_date', endIso);
      if (error) return 0;
      return count ?? 0;
    },
  });
}
