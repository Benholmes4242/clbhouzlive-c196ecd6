import type { FeedPost } from '@/components/media-system/types/media';

/**
 * The course ids of the page's round posts, identified by score-id presence
 * (postScoreIdMap). FeedPost.postType is not populated by every feed read, so
 * a post_type classifier here returns nothing at runtime. Restore the
 * post_type form only once post_type reaches the client on every read.
 */
export function roundCourseIdsFor(
  posts: FeedPost[],
  postScoreIdMap: Pick<Map<string, string>, 'has'>,
): string[] {
  const ids = new Set<string>();
  for (const p of posts) if (postScoreIdMap.has(p.id) && p.courseId) ids.add(p.courseId);
  return [...ids];
}
