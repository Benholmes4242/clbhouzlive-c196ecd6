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
import {
  FEED_QUERY_KEYS,
  PROFILE_QUERY_KEYS,
  ENGAGEMENT_RECORD_KEYS,
  ENGAGEMENT_ONLY_KEYS,
} from './feedQueryKeys';
import { applyEngagementDelta, type EngagementDelta } from './applyEngagementDelta';
import { engagementBus } from './engagementBus';

interface PatchOptions {
  /**
   * Key prefixes to SKIP when walking ENGAGEMENT_CACHE_KEYS.
   * Use this when the caller has already updated a specific cache entry
   * directly (e.g. an optimistic update in onMutate) and doesn't want
   * the helper to re-apply the delta.
   */
  skipKeyPrefixes?: readonly (readonly unknown[])[];
}

/**
 * Audit-derived list of every query key prefix that holds post engagement
 * state. React Query prefix-matches via `setQueriesData`, so listing the
 * shortest unique prefix is sufficient.
 */
const ENGAGEMENT_CACHE_KEYS: readonly (readonly unknown[])[] = [
  ...FEED_QUERY_KEYS,
  ...PROFILE_QUERY_KEYS,
  ...ENGAGEMENT_RECORD_KEYS,
  ...ENGAGEMENT_ONLY_KEYS,
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
  options?: PatchOptions,
): void {
  const skip = options?.skipKeyPrefixes ?? [];
  const updatePostObject = (post: any) => applyEngagementDelta(post, postId, delta);

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
    // Skip prefixes the caller has already handled (e.g. optimistic updates).
    const isSkipped = skip.some(
      (s) =>
        s.length === keyPrefix.length && s.every((v, i) => v === keyPrefix[i]),
    );
    if (isSkipped) continue;

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
          return applyEngagementDelta(oldData, null, delta);
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

  // Notify non-RQ subscribers (e.g. zustand snapshots like useFullscreenFeedStore).
  // Subscribers must apply the same delta to their own state via applyEngagementDelta.
  engagementBus.emit({ postId, delta });
}
