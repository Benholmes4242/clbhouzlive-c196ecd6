/**
 * THE PLAIN ROUND TOTAL — one definition, stated here once.
 *
 * COUNTS: every row in `whs_scores` for the member's WHS connection. Nine-hole
 * rounds included, penalty scores included, unmapped courses included. This is
 * the same population posted history reads (`useAllScores`) and the same figure
 * the handicap footer's "All {n} rounds" link states, so the profile header and
 * the posted-history sheet can never disagree. Measured 10 Sep 2026: 245.
 *
 * IT IS NOT THE OTHER COUNTS. Each is a SEPARATE DEFINITION, and the fact that
 * some of them return the same number for the test member is a property of that
 * member, NOT a definition:
 *   243 — `whs_scores` rows with `is_nine_hole` false. "Eighteen holes posted."
 *   243 — rounds whose hole detail was fetched. "A card can be drawn."
 *   243 — `gam_round_stats` rows with `holes_played = 18`. The evaluator's own
 *         eighteen-hole population.
 *   239 — mapped, non-penalty rounds summed from `gam_user_courses()`.
 *         The basis for the per-course analytics rows.
 *
 * THOSE THREE 243s COINCIDE ONLY BECAUSE THIS MEMBER'S ONLY GAPS ARE TWO
 * NINE-HOLE ROUNDS. THEY DO NOT COINCIDE IN GENERAL. Measured across the base
 * earlier this week: 568 of 3,554 rounds cannot draw a card — 420 have hole rows
 * with no scores, 195 are partial, 148 have no hole rows at all. So "eighteen
 * holes posted" and "has hole detail" are DIFFERENT POPULATIONS for most members,
 * and reading them here as one definition will be wrong on the next member
 * somebody checks. State which question a surface is asking; never assume two
 * questions have one answer because they did once.
 *
 * THREE STATES, NEVER A CONFIDENT ZERO. A failed read returns `isError`, an
 * unrun or in-flight read is not fetched, and only a fetched read with zero
 * rows is a real zero. The gate is `isFetched`, NOT `isLoading`: a disabled
 * React Query v5 query is pending with `fetchStatus: 'idle'`, so `isLoading` is
 * false before it has ever run and an `isLoading` gate renders a dash that
 * never resolves.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useWhsConnection } from '@/lib/whs/hooks';

export interface MemberRoundTotal {
  /** Plain total, or null while unknown (not fetched, errored, no connection). */
  total: number | null;
  state: 'ok' | 'loading' | 'error';
}

export function useMemberRoundTotal(userId: string | undefined): MemberRoundTotal {
  const {
    data: connection,
    isFetched: connectionFetched,
    isError: connectionError,
  } = useWhsConnection(userId);

  const connectionId = (connection as { id?: string } | null | undefined)?.id;

  const {
    data: total,
    isFetched,
    isError,
  } = useQuery({
    queryKey: ['profile', 'round-total', connectionId ?? ''],
    enabled: !!connectionId,
    staleTime: 60_000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('whs_scores' as never)
        .select('id', { count: 'exact', head: true })
        .eq('connection_id', connectionId as string);
      if (error) throw error;
      return count ?? 0;
    },
  });

  if (!userId) return { total: null, state: 'loading' };
  if (connectionError || isError) return { total: null, state: 'error' };
  if (!connectionFetched) return { total: null, state: 'loading' };
  // Fetched with no connection: the member has no WHS record at all. That is a
  // known absence, not a failed read, and the caller hides the cell.
  if (!connectionId) return { total: null, state: 'ok' };
  if (!isFetched) return { total: null, state: 'loading' };
  return { total: total ?? null, state: 'ok' };
}

export default useMemberRoundTotal;
