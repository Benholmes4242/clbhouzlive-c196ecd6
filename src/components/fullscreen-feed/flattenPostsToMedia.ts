/**
 * flattenPostsToMedia — turn a list of FeedPosts (possibly multi-media each)
 * into a flat list with one media item per "post" entry. Used by course-detail
 * entry points to drive the fullscreen viewer in gallery mode (one media per
 * vertical slide, no left/right carousel).
 *
 * Each flat entry preserves the parent post's metadata but gets a unique id
 * suffix (`${post.id}::${i}`) so the fullscreen store's dedupe-on-append
 * works correctly across paginated pages.
 */
import type { FeedPost } from '@/components/media-system/types/media';

export interface FlattenResult {
  flat: FeedPost[];
  parentIndex: number[];
  offsetsByParent: number[];
}

export function flattenPostsToMedia(posts: FeedPost[]): FlattenResult {
  const flat: FeedPost[] = [];
  const parentIndex: number[] = [];
  const offsetsByParent: number[] = [];
  posts.forEach((post, p) => {
    offsetsByParent[p] = flat.length;
    const items = post.mediaItems ?? [];
    if (items.length === 0) return;
    items.forEach((item, i) => {
      flat.push({ ...post, id: `${post.id}::${i}`, mediaItems: [item] });
      parentIndex.push(p);
    });
  });
  return { flat, parentIndex, offsetsByParent };
}

export function flatIndexFor(offsets: number[], postIndex: number, mediaIndex = 0) {
  return (offsets[postIndex] ?? 0) + mediaIndex;
}
