/**
 * Given a list of post ids, returns a Set of those liked by the supplied
 * actor (typically the active actor — `useActiveActor().activeActor`).
 *
 * Use this whenever you build FeedPost-shaped objects from an RPC that
 * doesn't project `is_liked_by_me`. The Watch rails (continue-watching,
 * most-loved, of-the-week heroes) all need this because their RPCs are
 * scoped to "what content exists" and don't know who the viewer is.
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

  const { data, error } = await supabase
    .from('post_likes')
    .select('post_id')
    .in('post_id', postIds)
    .eq('actor_id', actor.id)
    .eq('actor_type', actor.type);

  if (error) {
    if (import.meta.env.DEV) {
      console.error('[likedPostIds] query failed:', error);
    }
    return new Set();
  }

  return new Set((data ?? []).map((r) => r.post_id));
}

export async function isPostLikedByMe(
  postId: string,
  actor: LikedByMeActor | null,
): Promise<boolean> {
  const set = await fetchLikedPostIds([postId], actor);
  return set.has(postId);
}
