/**
 * Given a list of post ids, returns a Set of those liked by the supplied
 * actor (typically the active actor — `useActiveActor().activeActor`).
 *
 * Use this whenever you build FeedPost-shaped objects from an RPC that
 * doesn't project `is_liked_by_me`. The Watch rails (continue-watching,
 * most-loved, of-the-week heroes) all need this because their RPCs are
 * scoped to "what content exists" and don't know who the viewer is.
 *
 * IMPORTANT — this is the client mirror of the canonical SQL predicate
 * `public.viewer_liked_post(post_id, viewer, actor_type)`. Round-backed
 * posts (`posts.whs_score_id IS NOT NULL`) take their hearts from
 * `content_reactions` (`target_type = 'round'`), everything else from
 * `post_likes`. If the SQL helper changes, change this with it.
 *
 * Returns an empty Set on any error — better to render hearts as empty
 * than to crash the rail. The engagementBus will still patch correctly
 * when the user taps.
 */

import { supabase } from '@/integrations/supabase/client';

export interface LikedByMeActor {
  id: string;
  type: 'personal' | 'business';
}

export async function fetchLikedPostIds(
  postIds: string[],
  actor: LikedByMeActor | null,
): Promise<Set<string>> {
  if (!actor || postIds.length === 0) return new Set();

  const liked = new Set<string>();

  const legacy = supabase
    .from('post_likes')
    .select('post_id')
    .in('post_id', postIds)
    .eq('actor_id', actor.id)
    .eq('actor_type', actor.type);

  // Round reactions are personal-actor only (content_reactions has no actor
  // columns yet). Business actors keep the post_likes path alone.
  const rounds =
    actor.type === 'personal'
      ? supabase
          .from('posts')
          .select('id, whs_score_id')
          .in('id', postIds)
          .not('whs_score_id', 'is', null)
      : null;

  const [legacyRes, roundsRes] = await Promise.all([legacy, rounds]);

  if (legacyRes.error) {
    if (import.meta.env.DEV) {
      console.error('[likedPostIds] post_likes query failed:', legacyRes.error);
    }
  } else {
    for (const row of legacyRes.data ?? []) liked.add(row.post_id);
  }

  const roundRows = (roundsRes?.data ?? []) as Array<{ id: string; whs_score_id: string | null }>;
  if (roundsRes?.error && import.meta.env.DEV) {
    console.error('[likedPostIds] round lookup failed:', roundsRes.error);
  }

  if (roundRows.length > 0) {
    const scoreToPost = new Map<string, string[]>();
    for (const row of roundRows) {
      if (!row.whs_score_id) continue;
      const existing = scoreToPost.get(row.whs_score_id);
      if (existing) existing.push(row.id);
      else scoreToPost.set(row.whs_score_id, [row.id]);
    }

    const scoreIds = [...scoreToPost.keys()];
    if (scoreIds.length > 0) {
      const { data, error } = await supabase
        .from('content_reactions')
        .select('target_id')
        .eq('target_type', 'round')
        .eq('user_id', actor.id)
        .in('target_id', scoreIds);

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[likedPostIds] content_reactions query failed:', error);
        }
      } else {
        for (const row of data ?? []) {
          for (const postId of scoreToPost.get(row.target_id) ?? []) liked.add(postId);
        }
      }
    }
  }

  return liked;
}

export async function isPostLikedByMe(
  postId: string,
  actor: LikedByMeActor | null,
): Promise<boolean> {
  const set = await fetchLikedPostIds([postId], actor);
  return set.has(postId);
}
