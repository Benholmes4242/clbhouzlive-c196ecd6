/**
 * useReactionPostIds — resolves a window of round score ids and review ids to
 * the post ids that carry them, so useContentReactions can name post-keyed
 * caches from the identity their READERS use (usePostLikes subscribes under
 * ['post-likes', POST_ID, 'post']).
 *
 * ONE READ PER TARGET TYPE PER WINDOW, never per card:
 *   - rounds:  the SAME query as useRoundPostComments (shared key), so a window
 *              that already reads round posts adds no request
 *   - reviews: posts.id, source_review_id WHERE source_review_id IN (reviewIds)
 * A window with only rounds (or only reviews) issues one read; stories issue
 * none. A round or review with no post resolves to null — callers must then
 * seed NOTHING post-keyed.
 */
import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';
import { roundPostsQuery } from './useRoundPostComments';

export interface ReactionPostTarget {
  type: string;
  id: string;
}

function idsOf(targets: readonly ReactionPostTarget[], type: string): string[] {
  const seen = new Set<string>();
  for (const t of targets) if (t.type === type && t.id) seen.add(t.id);
  return [...seen].sort();
}

export function useReactionPostIds(targets: readonly ReactionPostTarget[]) {
  const roundIds = useMemo(() => idsOf(targets, 'round'), [targets]);
  const reviewIds = useMemo(() => idsOf(targets, 'review'), [targets]);

  // Same key and fn as useRoundPostComments: where both run, one request.
  const rounds = useQuery(roundPostsQuery(roundIds));

  const reviews = useQuery<{ id: string; source_review_id: string | null }[]>({
    queryKey: ['reaction-post-ids', 'review', reviewIds.join(',')],
    enabled: reviewIds.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, source_review_id')
        .in('source_review_id', reviewIds);
      if (error) throw error;
      return (data ?? []) as { id: string; source_review_id: string | null }[];
    },
  });

  const map = useMemo(() => {
    const out = new Map<string, string>();
    for (const r of rounds.data ?? []) if (r.whs_score_id && r.id) out.set(r.whs_score_id, r.id);
    for (const r of reviews.data ?? []) if (r.source_review_id && r.id) out.set(r.source_review_id, r.id);
    return out;
  }, [rounds.data, reviews.data]);

  return useCallback((targetId: string): string | null => map.get(targetId) ?? null, [map]);
}

export default useReactionPostIds;
