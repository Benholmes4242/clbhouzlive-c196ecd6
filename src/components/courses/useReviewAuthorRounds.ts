/**
 * useReviewAuthorRounds — the reviewer's own rounds behind each review on the
 * Latest reviews rail (BRIEF_COURSES_MEMBERS_SECTIONS §2).
 *
 * ONE read for the whole pool: get_review_author_rounds carries up to 100 ids
 * per call and the browse pool is capped below that, so the batch loop is a
 * guard against a future cap, not a second read.
 *
 * The answer depends on who is looking (can_view_handicap), so the viewer sits
 * in the key. An error settles the read and shows no strip — never a
 * placeholder, never an invented figure.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { batches } from '@/lib/batches';
import { settled } from './browse/PageLoadGate';
import {
  AUTHOR_ROUNDS_MAX_IDS,
  toAuthorRoundsMap,
  type ReviewAuthorRound,
} from './reviewAuthorRounds';

export function useReviewAuthorRounds(reviewIds: string[], viewerId: string | null | undefined) {
  const sorted = useMemo(() => Array.from(new Set(reviewIds)).sort(), [reviewIds]);
  const query = useQuery({
    queryKey: ['course-review-author-rounds', viewerId ?? 'guest', sorted],
    enabled: sorted.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ReviewAuthorRound[]> => {
      const out: ReviewAuthorRound[] = [];
      for (const batch of batches(sorted, AUTHOR_ROUNDS_MAX_IDS)) {
        // The RPC is already deployed; generated client types may lag that contract.
        const { data, error } = await (supabase.rpc as unknown as (
          name: string,
          args: Record<string, unknown>,
        ) => Promise<{ data: ReviewAuthorRound[] | null; error: unknown }>)('get_review_author_rounds', {
          p_review_ids: batch,
        });
        if (error) throw error;
        if (Array.isArray(data)) out.push(...data);
      }
      return out;
    },
  });
  const map = useMemo(() => toAuthorRoundsMap(query.data ?? []), [query.data]);
  /** Nothing to ask is already settled: an empty pool must never hold the gate. */
  return { map, settled: sorted.length === 0 || settled(query) };
}

export default useReviewAuthorRounds;
