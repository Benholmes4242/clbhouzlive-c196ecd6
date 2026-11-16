/** One read per member and badge kind, only while its card is open. Results
 * visibility is the server's switch; off or failed means no figures. */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { parseWorldRank } from '@/features/pro-profile/proProfileRules';
import { BADGE_FACTS_STALE_MS, amateurFacts, amateurYearMove, tourFacts, type BadgeFact, type BadgeKind } from './memberBadgeRules';

export function useMemberBadgeFacts(userId: string, kind: BadgeKind | null) {
  return useQuery({
    queryKey: ['member-badge-facts', userId, kind],
    enabled: !!userId && (kind === 'tour_pro' || kind === 'amateur'),
    staleTime: BADGE_FACTS_STALE_MS,
    queryFn: async (): Promise<BadgeFact[]> => {
      const year = new Date().getFullYear();
      if (kind === 'tour_pro') {
        const visible = await supabase.rpc('pro_results_visible', { p_user: userId });
        if (visible.error || visible.data !== true) return [];
        const [rank, events] = await Promise.all([
          supabase.rpc('get_pro_world_rank', { p_user_id: userId }),
          supabase.from('pro_events').select('id', { count: 'exact', head: true }).eq('user_id', userId)
            .gte('start_date', `${year}-01-01`).lte('start_date', `${year}-12-31`),
        ]);
        return tourFacts(rank.error ? null : parseWorldRank(rank.data)?.rank ?? null, events.error ? null : events.count ?? null);
      }
      const visible = await supabase.rpc('amateur_results_visible', { p_user: userId });
      if (visible.error || visible.data !== true) return [];
      const [summary, history] = await Promise.all([
        supabase.from('amateur_rank_summary').select('rank').eq('user_id', userId).maybeSingle(),
        supabase.from('amateur_rank_history').select('id,week,rank').eq('user_id', userId).gte('week', year * 100).lt('week', (year + 1) * 100),
      ]);
      const rank = summary.error ? null : (summary.data?.rank ?? null);
      return amateurFacts(rank, history.error ? null : amateurYearMove(history.data ?? [], rank, year));
    },
  });
}
