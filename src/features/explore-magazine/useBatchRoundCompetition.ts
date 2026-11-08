import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * ONE READ PER RENDERED PAGE of round cards: gam_round_stats.is_competition,
 * keyed on the cards' score ids — the useBatchRoundMedals pattern. Call this
 * ONCE in the stream, never per card, so it works for cards with or without a
 * hole shape.
 *
 * EXPLICIT TRUE ONLY. A missing row, null or false all render NO mark — the
 * CompetitionMark is a statement, never a default. The same empty result comes
 * back when RLS hides that member's stats from this viewer, which is CORRECT:
 * no mark renders. Do not add a fallback read path.
 */
export function useBatchRoundCompetition(scoreIds: Array<string | null | undefined>) {
  const ids = useMemo(
    () => Array.from(new Set(scoreIds.filter((id): id is string => !!id))).sort(),
    [scoreIds],
  );
  const query = useQuery({
    queryKey: ['explore-round-competition', ids],
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Map<string, boolean>> => {
      const { data, error } = await supabase
        .from('gam_round_stats')
        .select('whs_score_id, is_competition')
        .in('whs_score_id', ids);
      if (error) throw error;
      const map = new Map<string, boolean>();
      for (const row of (data ?? []) as Array<{ whs_score_id: string | null; is_competition: boolean | null }>) {
        if (!row.whs_score_id) continue;
        map.set(row.whs_score_id, row.is_competition === true);
      }
      return map;
    },
  });
  return { competition: query.data, isSuccess: query.isSuccess, isFetched: query.isFetched };
}
