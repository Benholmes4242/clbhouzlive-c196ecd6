import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import type { RoundAwardRow } from '@/hooks/gam/useRoundAwards';

/** `awards` carries each award by name, from the SAME one batched read, so a
 *  round card can name its awards without a second request. */
export interface RoundMedalCounts { gold: number; silver: number; bronze: number; awards: RoundAwardRow[] }

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
        .select('whs_score_id, tier, award_kind, unit_kind, unit_key, value, previous_value, delta, rank_here, attempts_at_detection')
        .in('whs_score_id', ids);
      if (error) throw error;
      const map = new Map<string, RoundMedalCounts>();
      type Row = { whs_score_id: string | null; tier: string | null; award_kind: string; unit_kind: string; unit_key: number; value: number | null; previous_value: number | null; delta: number | null; rank_here: number | null; attempts_at_detection: number | null };
      for (const row of (data ?? []) as Row[]) {
        if (!row.whs_score_id) continue;
        const entry = map.get(row.whs_score_id) ?? { gold: 0, silver: 0, bronze: 0, awards: [] };
        if (row.tier === 'gold' || row.tier === 'silver' || row.tier === 'bronze') {
          entry[row.tier] += 1;
          entry.awards.push({
            award_kind: row.award_kind, unit_kind: row.unit_kind as RoundAwardRow['unit_kind'], unit_key: row.unit_key,
            tier: row.tier, value: row.value, previous_value: row.previous_value, delta: row.delta,
            rank_here: row.rank_here, attempts: row.attempts_at_detection,
          });
        }
        map.set(row.whs_score_id, entry);
      }
      return map;
    },
  });
  return { medals: query.data, isSuccess: query.isSuccess, isFetched: query.isFetched };
}
