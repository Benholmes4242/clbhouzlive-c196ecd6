import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

/**
 * useRoundNetScores (BRIEF_BOARD_LOWEST_NET, section 1).
 *
 * ONE batched read of public.gam_round_net for the WHOLE window, keyed on the
 * sorted whs_score_id set the board already holds — the same identifier the
 * reactions hook and the round cards use, so the returned map lines up with the
 * rows without a second identifier (§1.2). NEVER one call per row (§1.3).
 *
 * NET IS THE DATABASE'S NUMBER, NOT OURS (§3.1/§3.2). The view computes
 * gross_score - whs_course_handicap(hcp_at_time, slope, course rating, par).
 * There is deliberately NO course-handicap arithmetic in this file: a second
 * copy of the WHS formula in the client is how the two drift.
 *
 * THE VIEW IS security_invoker (§1.4), so RLS is enforced through it and a
 * member sees exactly the rounds they would see on gam_round_stats. No extra
 * filter is added here to compensate.
 *
 * A round with no net_score is simply ABSENT from the map — it does not
 * qualify, and it is never defaulted or substituted with gross (§2.2). If the
 * view is unreachable the hook reports an empty map and the Lowest net board
 * shows no qualifiers rather than throwing.
 */

/** Postgres/PostgREST codes for "relation does not exist". */
const MISSING_TABLE = new Set(['42P01', 'PGRST205', 'PGRST204']);

interface Row {
  whs_score_id: string;
  net_score: number | null;
}

export interface RoundNet {
  net: number;
}

const EMPTY = new Map<string, RoundNet>();

export function useRoundNetScores(scoreIds: readonly (string | null | undefined)[]) {
  const ids = useMemo(() => {
    const seen = new Set<string>();
    for (const id of scoreIds) if (id) seen.add(id);
    return [...seen].sort();
  }, [scoreIds]);

  const { data } = useQuery<Map<string, RoundNet>>({
    queryKey: ['gam-round-net', ids.join(',')],
    enabled: ids.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('gam_round_net' as never)
        .select('whs_score_id, net_score')
        .in('whs_score_id', ids);
      if (error) {
        if (MISSING_TABLE.has(String((error as { code?: string }).code ?? ''))) {
          console.warn('[net] gam_round_net is unavailable; Lowest net has no qualifiers');
          return new Map();
        }
        throw error;
      }
      const out = new Map<string, RoundNet>();
      for (const r of ((rows ?? []) as unknown) as Row[]) {
        if (r.whs_score_id && r.net_score != null && Number.isFinite(Number(r.net_score))) {
          out.set(r.whs_score_id, { net: Number(r.net_score) });
        }
      }
      return out;
    },
  });

  return data ?? EMPTY;
}

export default useRoundNetScores;
