import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

export interface RoundMedalCounts { gold: number; silver: number; bronze: number }

/**
 * ONE READ PER RENDERED PAGE of Explore round cards: medal counts straight from
 * gam_round_awards (two columns only — award detail belongs to the scorecard
 * sheet's useRoundAwards). Call this ONCE in the stream, never per card.
 *
 * ABSENT MEANS ZERO, AND THAT INCLUDES RLS. A score id with no rows has no
 * medals. The same empty result comes back when the SELECT policies hide that
 * member's awards from this viewer — that is CORRECT and renders no cluster.
 * Do not treat empty as an error, do not retry it, and do not add a fallback
 * read path that tries to get it another way.
 */
export function useBatchRoundMedals(scoreIds: Array<string | null | undefined>) {
  const ids = useMemo(
    () => Array.from(new Set(scoreIds.filter((id): id is string => !!id))).sort(),
    [scoreIds],
  );
  const query = useQuery({
    queryKey: ['explore-round-medals', ids],
    enabled: ids.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<Map<string, RoundMedalCounts>> => {
      const { data, error } = await supabase
        .from('gam_round_awards')
        .select('whs_score_id, tier')
        .in('whs_score_id', ids);
      if (error) throw error;
      const map = new Map<string, RoundMedalCounts>();
      for (const row of (data ?? []) as Array<{ whs_score_id: string | null; tier: string | null }>) {
        if (!row.whs_score_id) continue;
        const entry = map.get(row.whs_score_id) ?? { gold: 0, silver: 0, bronze: 0 };
        if (row.tier === 'gold' || row.tier === 'silver' || row.tier === 'bronze') entry[row.tier] += 1;
        map.set(row.whs_score_id, entry);
      }
      return map;
    },
  });
  return { medals: query.data, isSuccess: query.isSuccess, isFetched: query.isFetched };
}
