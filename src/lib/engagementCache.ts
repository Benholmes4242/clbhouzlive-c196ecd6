/**
 * engagementCache — single source of truth for patching post engagement
 * (likes + comments) state across every feed cache in the app.
 *
 * Architectural rule (per Engagement State Consistency Audit):
 *   All like/comment counters and `isLikedByMe` flags are patched into
 *   existing query caches by THIS helper, invoked by every engagement
 *   mutation. No surface should hold engagement state in `useState` derived
 *   from props. No mutation hook should invalidate without either (a)
 *   actively refetching or (b) calling this helper.
 *
 * When adding a new feed surface that displays likes/comments, ADD ITS
 * QUERY KEY PREFIX TO `ENGAGEMENT_CACHE_KEYS`. That list is the single
 * source of truth for which caches to patch.
 *
 * NOTE: Editorial cards (`editorial_card_likes` table, `usePostLikes(...,
 * 'editorial')`) are intentionally NOT covered — they live in a separate
 * data path with separate hooks. Do not merge them in here.
 */

import type { QueryClient } from '@tanstack/react-query';

interface EngagementDelta {
  /** New value for `isLikedByMe`. Omit to leave unchanged. */
  isLikedByMe?: boolean;
  /** Apply +1 / -1 to like count. Omit to leave unchanged. */
  likeCountDelta?: number;
  /** Apply +1 / -1 to comment count. Omit to leave unchanged. */
  commentCountDelta?: number;
}

/**
 * Audit-derived list of every query key prefix that holds post engagement
 * state. React Query prefix-matches via `setQueriesData`, so listing the
 * shortest unique prefix is sufficient.
 */
const ENGAGEMENT_CACHE_KEYS: readonly (readonly unknown[])[] = [
  // Clubhouse + cross-app feeds
  ['media-feed', 'suggested'],
  ['media-feed', 'friends'],
  ['explore-posts'],
  ['real-posts'],

  // Watch tab
  ['watch-feed'],
  ['watch-feed-posts-by-ids'],

  // Profile + actor feeds
  ['profile-posts'],
  ['actor-posts'],
  ['userPosts'],
  ['user-posts-preview'],
  ['followedUsersPosts'],
  ['activity-posts'],

  // Business surfaces (single-post engagement key)
  ['post-engagement'],
  ['business-posts-infinite'],
  ['business-tagged-posts'],
  ['business-tagged-posts-infinite'],

  // Course detail surfaces
  ['course-media-feed'],
  ['course-reviews-full'],
  ['user-course-reviews'],
  ['friend-course-activity'],
];

/**
 * Patches engagement state for `postId` across every feed cache without
 * triggering a refetch. Avoids both:
 *   - Network round-trip
 *   - Clubhouse scroll-snap re-ordering (no refetch ⇒ no re-render reorder)
 *
 * Handles four cache shapes:
 *   1. Infinite query: { pages: [{ posts: [...] } | [...]], pageParams }
 *   2. Flat array: [...]
 *   3. Object with posts: { posts: [...], ... }
 *   4. Single post-engagement object: { isLikedByMe, likesCount, ... }
 */
export function patchEngagement(
  queryClient: QueryClient,
  postId: string,
  delta: EngagementDelta,
): void {
  const updatePostObject = (post: any): any => {
    if (!post || post.id !== postId) return post;

    const patched = { ...post };

    if (delta.isLikedByMe !== undefined) {
      patched.isLikedByMe = delta.isLikedByMe;
      patched.is_liked_by_me = delta.isLikedByMe;
      patched.hasLiked = delta.isLikedByMe;
      patched.has_liked = delta.isLikedByMe;
    }

    if (delta.likeCountDelta !== undefined) {
      const current =
        patched.likeCount ??
        patched.like_count ??
        patched.likesCount ??
        patched.likes_count ??
        0;
      const next = Math.max(0, current + delta.likeCountDelta);
      patched.likeCount = next;
      patched.like_count = next;
      patched.likesCount = next;
      patched.likes_count = next;
    }

    if (delta.commentCountDelta !== undefined) {
      const current =
        patched.commentCount ??
        patched.comment_count ??
        patched.commentsCount ??
        patched.comments_count ??
        0;
      const next = Math.max(0, current + delta.commentCountDelta);
      patched.commentCount = next;
      patched.comment_count = next;
      patched.commentsCount = next;
      patched.comments_count = next;
    }

    return patched;
  };

  /** Detects whether an object is a post-engagement single record. */
  const isEngagementRecord = (obj: any): boolean =>
    obj &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    !obj.pages &&
    !obj.posts &&
    ('isLikedByMe' in obj ||
      'likesCount' in obj ||
      'hasLiked' in obj ||
      'commentsCount' in obj);

  for (const keyPrefix of ENGAGEMENT_CACHE_KEYS) {
    queryClient.setQueriesData(
      { queryKey: keyPrefix as readonly unknown[] },
      (oldData: any) => {
        if (!oldData) return oldData;

        // Shape 1: infinite query
        if (oldData.pages && Array.isArray(oldData.pages)) {
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => {
              if (page?.posts && Array.isArray(page.posts)) {
                return { ...page, posts: page.posts.map(updatePostObject) };
              }
              if (Array.isArray(page)) {
                return page.map(updatePostObject);
              }
              return page;
            }),
          };
        }

        // Shape 2: flat array
        if (Array.isArray(oldData)) {
          return oldData.map(updatePostObject);
        }

        // Shape 3: object with `posts` array
        if (oldData.posts && Array.isArray(oldData.posts)) {
          return { ...oldData, posts: oldData.posts.map(updatePostObject) };
        }

        // Shape 4: single engagement record (e.g. ['post-engagement', postId, ...])
        // These records don't carry `id`, so we patch unconditionally — the key
        // already scopes us to the right post.
        if (isEngagementRecord(oldData)) {
          const patched = { ...oldData };
          if (delta.isLikedByMe !== undefined) {
            patched.isLikedByMe = delta.isLikedByMe;
            patched.hasLiked = delta.isLikedByMe;
            patched.has_liked = delta.isLikedByMe;
          }
          if (delta.likeCountDelta !== undefined) {
            const current =
              patched.likesCount ?? patched.likeCount ?? patched.likes_count ?? 0;
            patched.likesCount = Math.max(0, current + delta.likeCountDelta);
            patched.likeCount = patched.likesCount;
            patched.likes_count = patched.likesCount;
          }
          if (delta.commentCountDelta !== undefined) {
            const current =
              patched.commentsCount ?? patched.commentCount ?? patched.comments_count ?? 0;
            patched.commentsCount = Math.max(0, current + delta.commentCountDelta);
            patched.commentCount = patched.commentsCount;
            patched.comments_count = patched.commentsCount;
          }
          return patched;
        }

        // Unknown shape — leave untouched (defensive).
        return oldData;
      },
    );
  }

  // Active invalidations for keys we ALWAYS want to refetch:
  // - Likes sheet for THIS post (modal, gated by `enabled: isOpen`)
  // - Notifications (may include "X liked your post")
  // - Per-user "what posts have I liked"
  queryClient.invalidateQueries({ queryKey: ['post-likes', postId, 'post'] });
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
  queryClient.invalidateQueries({ queryKey: ['user-post-likes'] });
}
