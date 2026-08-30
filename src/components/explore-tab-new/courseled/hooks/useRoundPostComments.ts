/**
 * useRoundPostComments (BRIEF_ROUND_COMMENTS_EVERYWHERE §S1).
 *
 * TWO IDENTIFIERS, ONE ROUND. Reactions key on `whs_score_id`
 * (content_reactions, target_type 'round'); comments key on the POST id
 * (comments_v2, target_type 'post'). A CircleRoundRow carries only the score
 * id, so this hook is the bridge.
 *
 * ONE CALL PER WINDOW, never per card: the caller hands over the whole visible
 * set of score ids and this issues a single `in('whs_score_id', ids)` read of
 * public.posts, joining `id` + `comment_count` into a map keyed on the score id.
 * posts.whs_score_id is one-to-one with a round post (verified: 726 rows, 726
 * distinct), so the map is unambiguous.
 *
 * A round with no post yields no post id, and the caller renders NO comment
 * affordance — nothing here ever creates a post (§1.6).
 *
 * FRESHNESS: posts.comment_count is maintained by the comments_v2 count
 * triggers, so a comment written from ANY surface moves the same number. This
 * hook subscribes to comments_v2 inserts/deletes once per window and
 * invalidates the whole `round-post-comments` family, so every window holding
 * the round agrees without a manual refresh (§3.4/§3.5).
 */
import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/integrations/supabase/client';

interface PostRow {
  id: string;
  whs_score_id: string;
  comment_count: number | null;
  user_id: string | null;
}

export interface RoundPostInfo {
  postId: string;
  commentCount: number;
  authorUserId: string | null;
}

export function useRoundPostComments(scoreIds: readonly (string | null | undefined)[]) {
  const qc = useQueryClient();

  const ids = useMemo(() => {
    const seen = new Set<string>();
    for (const id of scoreIds) if (id) seen.add(id);
    return [...seen].sort();
  }, [scoreIds]);

  const queryKey = useMemo(
    () => ['round-post-comments', ids.join(',')] as const,
    [ids],
  );

  const { data } = useQuery<PostRow[]>({
    queryKey,
    enabled: ids.length > 0,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('posts')
        .select('id, whs_score_id, comment_count, user_id')
        .in('whs_score_id', ids);
      if (error) throw error;
      return (rows ?? []) as unknown as PostRow[];
    },
  });

  const map = useMemo(() => {
    const out = new Map<string, RoundPostInfo>();
    for (const r of data ?? []) {
      if (!r.whs_score_id) continue;
      out.set(r.whs_score_id, {
        postId: r.id,
        commentCount: r.comment_count ?? 0,
        authorUserId: r.user_id ?? null,
      });
    }
    return out;
  }, [data]);

  /* REAL TIME, ONE CHANNEL PER WINDOW. comments_v2 filters take a single value,
     so the subscription is unfiltered on target and matched client-side against
     the post ids this window holds. */
  const postIdSet = useMemo(() => new Set([...map.values()].map((v) => v.postId)), [map]);

  useEffect(() => {
    if (postIdSet.size === 0) return;
    const invalidate = () =>
      qc.invalidateQueries({ queryKey: ['round-post-comments'] });
    const channel = supabase
      .channel(`round-post-comments:${[...postIdSet].sort().join(',').slice(0, 80)}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments_v2' },
        (payload) => {
          const row = (payload.new ?? {}) as { target_id?: string };
          if (row.target_id && postIdSet.has(row.target_id)) invalidate();
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'comments_v2' },
        () => invalidate(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [postIdSet, qc]);

  const infoFor = useCallback(
    (scoreId: string | null | undefined): RoundPostInfo | null =>
      (scoreId ? map.get(scoreId) : undefined) ?? null,
    [map],
  );

  return { infoFor };
}

export default useRoundPostComments;
