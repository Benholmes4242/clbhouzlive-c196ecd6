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
 *
 * TODO(post-launch): `isLikedByMe` in shared caches reflects the
 * last-fetching actor's like state. When a user acts as multiple actors
 * (personal + business) the cached flag can misrepresent the current
 * actor's state. Redesign to actor-partitioned engagement is deferred
 * post-launch; `useClubhouseLikes` mitigates locally for now.
 */

import type { QueryClient } from '@tanstack/react-query';
import type { LikeSource, PostLiker } from '@/hooks/usePostLikes';
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
  // SOURCE DELIBERATELY OMITTED: the same post can be read under more than one
  // LikeSource ('post' | 'editorial' | 'review' | 'round'); prefix-matching on
  // ['post-likes', postId] invalidates every one of them.
  queryClient.invalidateQueries({ queryKey: ['post-likes', postId] });
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
  queryClient.invalidateQueries({ queryKey: ['user-post-likes'] });

  // Notify non-RQ subscribers (e.g. zustand snapshots like useFullscreenFeedStore).
  // Subscribers must apply the same delta to their own state via applyEngagementDelta.
  engagementBus.emit({ postId, delta });
}


/** The viewing actor as the likers list should show them. */
export interface LikerViewer {
  /** Auth user id (the person behind the actor). */
  userId: string;
  actorType: 'personal' | 'business';
  /** Profile id for personal, business id for business. */
  actorId: string;
  name: string | null;
  avatarUrl: string | null;
  /** Business slug, used as the username for business actors. */
  slug?: string | null;
}

/**
 * seedViewerInLikers — THE ONLY place that decides what an optimistic viewer
 * entry in a likers list looks like. Both like-write paths call it:
 * useLikeMutation (post path, source 'post') and useContentReactions
 * (source 'round' | 'review').
 *
 * Writes the viewer to the FRONT of ['post-likes', subjectId, source] on like,
 * removes them on unlike. `source` is REQUIRED and never inferred: the same
 * fact is keyed on a post id under 'post' and on a review / whs_score id under
 * 'review' / 'round', and guessing one is the hardcoded-'post' fault.
 *
 * When there is no cached entry it creates one ONLY for a like — a first like
 * on a zero-like subject is what first enables the likers query, so without a
 * seed the row would fetch before the write commits and cache an empty list.
 * An unlike with no cache does nothing.
 *
 * Returns a revert function that restores the exact pre-tap cache.
 *
 * KNOWN LIMIT (do not "fix" by guessing an id): a like made on the POST path
 * cannot seed a likers list keyed on the REVIEW id (or whs_score id). The post
 * path holds only the post id; the review id is a different key it does not
 * know. Those lists catch up on the cross-family invalidation instead.
 */
export function seedViewerInLikers(
  queryClient: QueryClient,
  subjectId: string,
  source: LikeSource,
  viewer: LikerViewer,
  liked: boolean,
): () => void {
  const key = ['post-likes', subjectId, source] as const;
  const prev = queryClient.getQueryData<PostLiker[]>(key);
  const isMe = (l: PostLiker) =>
    (l.actorType ?? 'personal') === viewer.actorType &&
    (l.actorId ?? l.userId) === viewer.actorId;
  const me: PostLiker = {
    userId: viewer.actorType === 'business' ? viewer.userId : viewer.actorId,
    displayName: viewer.name ?? '',
    username: (viewer.actorType === 'business' ? viewer.slug : null) ?? viewer.name ?? '',
    avatarUrl: viewer.avatarUrl ?? null,
    actorType: viewer.actorType,
    actorId: viewer.actorId,
  };
  if (prev === undefined) {
    if (!liked) return () => {};
    queryClient.setQueryData<PostLiker[]>(key, [me]);
    return () => queryClient.removeQueries({ queryKey: key, exact: true });
  }
  const rest = prev.filter((l) => !isMe(l));
  queryClient.setQueryData<PostLiker[]>(key, liked ? [me, ...rest] : rest);
  return () => queryClient.setQueryData<PostLiker[]>(key, prev);
}
