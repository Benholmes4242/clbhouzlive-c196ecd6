import type { FeedPost } from '@/components/media-system/types/media';
import { isRoundPost } from '@/lib/posts/isRoundPost';

/**
 * The course ids of the page's ROUND posts, classified by post_type
 * (isRoundPost) — never by score-id presence — so the record read does not
 * wait on the score-id lookup and starts on mount with the other sources.
 */
export function roundCourseIdsFor(posts: FeedPost[]): string[] {
  const ids = new Set<string>();
  for (const p of posts) if (isRoundPost(p) && p.courseId) ids.add(p.courseId);
  return [...ids];
}
