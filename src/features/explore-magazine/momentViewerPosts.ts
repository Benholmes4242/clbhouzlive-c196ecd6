import type { Moment } from '@/components/explore-tab-new/courseled/hooks/useMomentsOfTheWeek';
import type { FeedPost } from '@/components/media-system/types/media';

/**
 * The posts a moments viewer swipes through, in list order. Several moments
 * can share one post (maxPerPost) and the viewer keys slides by post.id, so
 * only the FIRST occurrence of each post is kept; its other media stay
 * reachable through the post's carousel. Moments without a post are skipped.
 * index = the tapped moment's post position, or 0 if not found. Pure.
 */
export function momentViewerPosts(list: Moment[], tapped: Moment): { posts: FeedPost[]; index: number } {
  const posts: FeedPost[] = [];
  const seen = new Set<string>();
  for (const m of list) {
    const post = m?.post;
    if (!post || seen.has(post.id)) continue;
    seen.add(post.id);
    posts.push(post);
  }
  const tappedId = tapped?.post?.id;
  const found = tappedId == null ? -1 : posts.findIndex((p) => p.id === tappedId);
  return { posts, index: found < 0 ? 0 : found };
}
