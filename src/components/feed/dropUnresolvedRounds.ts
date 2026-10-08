/**
 * dropUnresolvedRounds — INVARIANT: a round post renders the round card or it
 * renders nothing. It never downgrades to an ordinary post: a round carries no
 * post_media, so an ordinary card for it is an empty slab.
 *
 * The ranker admits round posts whose gam_round_stats row the viewer cannot
 * read (round_pool LEFT JOINs + COALESCEs), and usePostRounds builds its map
 * from that same row, so for those posts the client has nothing and never
 * will. Once the round chain has SETTLED, such posts are removed from the list
 * here — at list level, before indices are assigned, so feedIndex (and the
 * index-based borderTop, video and carousel bookkeeping) is computed over the
 * posts that actually render. While the chain is still in flight nothing is
 * dropped: pending rounds render the card and fill in place. No timeout here;
 * useRoundChainGate already caps the wait.
 */
import type { FeedPost } from '@/components/media-system/types/media';
import type { PostRound } from '@/hooks/feed/usePostRounds';
import { isRoundPost } from '@/lib/posts/isRoundPost';

export function dropUnresolvedRounds(
  posts: FeedPost[],
  postScoreIdMap: Map<string, string> | undefined,
  postRoundMap: Map<string, PostRound> | undefined,
  settled: boolean,
): FeedPost[] {
  if (!settled) return posts;
  let changed = false;
  const kept = posts.filter((post) => {
    const sid = postScoreIdMap?.get(post.id) ?? null;
    // Classify by post_type only; score-id presence is the resolution check.
    if (!isRoundPost(post)) return true;
    const ok = !!sid && !!postRoundMap?.get(sid);
    if (!ok) changed = true;
    return ok;
  });
  return changed ? kept : posts;
}
