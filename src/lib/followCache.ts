/**
 * followCache — single source of truth for patching follow state across
 * every cache that holds it (feed posts, follow-status records, social
 * counts, suggested-user lists, relationship-status JSON).
 *
 * Architectural rule (per Follow State Consistency PR 2):
 *   Every follow/unfollow mutation calls `patchFollow` to propagate the
 *   change across every cached surface. No surface should hold follow
 *   state in `useState` derived from props. No mutation should invalidate
 *   without either (a) actively refetching or (b) calling this helper.
 *
 * Because the database trigger `auto_follow_on_friend_accept` creates a
 * `user_follows` row when a friend request is accepted, friend mutations
 * MUST also call `patchFollow` so follow caches stay in sync without a
 * manual refetch.
 *
 * Adding a new feed surface that displays follow state? ADD ITS QUERY
 * KEY PREFIX TO `FOLLOW_CACHE_KEYS`. That list is the single source of
 * truth for which caches to walk.
 *
 * Mirrors `engagementCache.ts` — same pattern proven on the engagement
 * state PR.
 */

import type { QueryClient } from '@tanstack/react-query';

export interface FollowTarget {
  /** 'business' writes to business_follows; 'personal' writes to user_follows */
  targetActorType: 'personal' | 'business';
  /** business.id when business; user.id when personal */
  targetActorId: string;
  /**
   * The post-owner user.id. For personal targets this equals targetActorId.
   * For business targets it's the human owner — used for surfaces that key
   * by user.id rather than actor.id (legacy keys, social-counts on humans).
   */
  targetUserId: string;
  /** Viewer actor type (the actor doing the follow) */
  viewerActorType?: 'personal' | 'business';
  /** Viewer actor id (business.id when posting as business, else user.id) */
  viewerActorId?: string;
  /** Viewer auth.uid() — used for legacy keys that key by user.id */
  viewerUserId?: string;
}

export interface FollowDelta {
  /** New value for `isFollowing` / `isFollowedByMe` */
  isFollowing: boolean;
}

interface PatchOptions {
  /**
   * Key prefixes to SKIP when walking FOLLOW_CACHE_KEYS. Use when the
   * caller already updated a specific cache entry directly (e.g. their own
   * onMutate optimistic update) and doesn't want the helper to re-apply.
   */
  skipKeyPrefixes?: readonly (readonly unknown[])[];
}

/**
 * Audit-derived list of every query key prefix that holds follow state.
 * React Query prefix-matches via `setQueriesData`, so listing the
 * shortest unique prefix is sufficient.
 */
export const FOLLOW_CACHE_KEYS: readonly (readonly unknown[])[] = [
  // Feed surfaces
  ['media-feed', 'suggested'],
  ['media-feed', 'friends'],
  ['explore-posts'],
  ['real-posts'],

  // Watch surfaces
  ['watch-feed'],
  ['watch-feed-posts-by-ids'],
  ['long-form-videos'],

  // Profile + actor feeds
  ['profile-posts'],
  ['actor-posts'],
  ['userPosts'],
  ['user-posts-preview'],
  ['followedUsersPosts'],
  ['activity-posts'],
  ['post-engagement'],

  // Business surfaces
  ['business-posts-infinite'],
  ['business-tagged-posts'],
  ['business-tagged-posts-infinite'],

  // Course surfaces
  ['course-media-feed'],

  // Discover surfaces
  ['suggested-creators'],
  ['suggested-users-discover'],
  ['golfers-discovery'],
  ['nearby-golfers'],

  // Direct follow-status queries (canonical 5-element key)
  ['follow-status'],

  // Legacy keys still in use (deprecate after PR 3 fully migrates)
  ['user-follow-status'],
  ['business-follow-status'],
  ['relationship-status'],
  ['relationship-statuses'],
  ['user-follows'],
  ['actor-following'],

  // Counts + lists
  ['social-counts'],
  ['followers-list'],
  ['following-list'],
  ['followers-paginated'],
  ['following-paginated'],

  // Cross-cutting
  ['discovery-exclusions'],
];

/* ─────────────────────────────── helpers ─────────────────────────────── */

function matchesTarget(post: any, target: FollowTarget): boolean {
  if (!post) return false;

  const postActorType =
    post.actorType ?? post.actor_type ?? (post.businessId ? 'business' : 'personal');
  const postActorId = post.actorId ?? post.actor_id ?? post.businessId ?? post.business_id;
  const postUserId = post.userId ?? post.user_id;

  if (target.targetActorType === 'business') {
    if (postActorType === 'business' && postActorId === target.targetActorId) return true;
    return false;
  }
  // personal
  if (postActorType === 'business') return false;
  // Match by either actor id or user id (covers all naming conventions)
  return (
    postActorId === target.targetActorId ||
    postUserId === target.targetUserId ||
    postUserId === target.targetActorId
  );
}

function patchPostObject(post: any, target: FollowTarget, delta: FollowDelta): any {
  if (!matchesTarget(post, target)) return post;
  return {
    ...post,
    isFollowedByMe: delta.isFollowing,
    is_followed_by_me: delta.isFollowing,
  };
}

const isFollowStatusRecord = (obj: any): boolean =>
  obj && typeof obj === 'object' && !Array.isArray(obj) && !obj.pages && !obj.posts &&
  ('isFollowing' in obj || 'is_following' in obj || 'isFollowedByMe' in obj);

const isRelationshipRecord = (obj: any): boolean =>
  obj && typeof obj === 'object' && !Array.isArray(obj) && !obj.pages && !obj.posts &&
  ('isFriend' in obj || 'is_friend' in obj || 'isBlocked' in obj || 'is_blocked' in obj);

/* ─────────────────────────────── patchFollow ─────────────────────────────── */

/**
 * Patches follow state for `target` across every relevant cache without
 * triggering a refetch. Handles these shapes:
 *
 *   1. Infinite query: { pages: [{ posts: [...] } | [...]], pageParams }
 *   2. Flat array of posts
 *   3. Object with `posts` array
 *   4. Single follow-status / relationship-status record
 *   5. Boolean record (legacy ['user-follow-status', ...] returns boolean)
 *   6. Suggested-user / golfer lists (array of profile rows with isFollowedByMe)
 *   7. social-counts records — bumps following/followers counts
 */
export function patchFollow(
  queryClient: QueryClient,
  target: FollowTarget,
  delta: FollowDelta,
  options?: PatchOptions,
): void {
  const skip = options?.skipKeyPrefixes ?? [];

  // First pass: queryKey-aware patches (need to inspect the actual key, not
  // just the prefix). React Query's setQueriesData updater doesn't receive
  // the queryKey, so we walk the cache manually for these.
  const cache = queryClient.getQueryCache();

  for (const keyPrefix of FOLLOW_CACHE_KEYS) {
    const isSkipped = skip.some(
      (s) => s.length === keyPrefix.length && s.every((v, i) => v === keyPrefix[i]),
    );
    if (isSkipped) continue;

    const isLegacyBooleanKey =
      keyPrefix[0] === 'user-follow-status' ||
      keyPrefix[0] === 'business-follow-status' ||
      keyPrefix[0] === 'user-follows';

    const isFollowStatusKey = keyPrefix[0] === 'follow-status';
    const isSocialCountsKey = keyPrefix[0] === 'social-counts';

    // Keys that need queryKey-aware patching: walk the cache manually.
    if (isLegacyBooleanKey || isFollowStatusKey || isSocialCountsKey) {
      const matches = cache.findAll({ queryKey: keyPrefix as readonly unknown[] });
      for (const q of matches) {
        const queryKey = q.queryKey as unknown[];
        const oldData = q.state.data as any;
        if (oldData === undefined || oldData === null) continue;

        if (isLegacyBooleanKey) {
          const matchesId =
            queryKey.includes(target.targetActorId) ||
            queryKey.includes(target.targetUserId);
          if (!matchesId) continue;
          if (typeof oldData === 'boolean') {
            queryClient.setQueryData(queryKey, delta.isFollowing);
          } else if (oldData && typeof oldData === 'object' && !Array.isArray(oldData) && !oldData.pages) {
            // boolean-ish object form (rare)
            queryClient.setQueryData(queryKey, { ...oldData, isFollowing: delta.isFollowing });
          }
          continue;
        }

        if (isFollowStatusKey) {
          // ['follow-status', viewerActorType, viewerActorId, targetActorType, targetActorId]
          const keyViewerType = queryKey[1];
          const keyViewerId = queryKey[2];
          const keyTargetType = queryKey[3];
          const keyTargetId = queryKey[4];
          const ok =
            keyTargetType === target.targetActorType &&
            keyTargetId === target.targetActorId &&
            (target.viewerActorType ? keyViewerType === target.viewerActorType : true) &&
            (target.viewerActorId ? keyViewerId === target.viewerActorId : true);
          if (!ok) continue;
          if (typeof oldData === 'boolean') {
            queryClient.setQueryData(queryKey, delta.isFollowing);
          } else {
            queryClient.setQueryData(queryKey, {
              ...(typeof oldData === 'object' ? oldData : {}),
              isFollowing: delta.isFollowing,
            });
          }
          continue;
        }

        if (isSocialCountsKey) {
          if (!oldData || typeof oldData !== 'object' || Array.isArray(oldData)) continue;
          const subjectId = queryKey[1];
          const dir = delta.isFollowing ? 1 : -1;
          if (subjectId === target.viewerUserId || subjectId === target.viewerActorId) {
            const cur = oldData.following ?? oldData.followingCount ?? 0;
            queryClient.setQueryData(queryKey, {
              ...oldData,
              following: Math.max(0, cur + dir),
              followingCount: Math.max(0, cur + dir),
            });
          } else if (subjectId === target.targetUserId || subjectId === target.targetActorId) {
            const cur = oldData.followers ?? oldData.followersCount ?? 0;
            queryClient.setQueryData(queryKey, {
              ...oldData,
              followers: Math.max(0, cur + dir),
              followersCount: Math.max(0, cur + dir),
            });
          }
        }
      }
      continue;
    }

    // Generic prefix patch — feed/post shapes filter by post identity
    queryClient.setQueriesData(
      { queryKey: keyPrefix as readonly unknown[] },
      (oldData: any) => {
        if (oldData === undefined || oldData === null) return oldData;

        // Shape 1: infinite query
        if (oldData.pages && Array.isArray(oldData.pages)) {
          return {
            ...oldData,
            pages: oldData.pages.map((page: any) => {
              if (page?.posts && Array.isArray(page.posts)) {
                return { ...page, posts: page.posts.map((p: any) => patchPostObject(p, target, delta)) };
              }
              if (Array.isArray(page)) {
                return page.map((p: any) => patchPostObject(p, target, delta));
              }
              return page;
            }),
          };
        }

        // Shape 2: flat array (posts OR profile rows)
        if (Array.isArray(oldData)) {
          return oldData.map((item: any) => patchPostObject(item, target, delta));
        }

        // Shape 3: object with `posts` array
        if (oldData.posts && Array.isArray(oldData.posts)) {
          return { ...oldData, posts: oldData.posts.map((p: any) => patchPostObject(p, target, delta)) };
        }

        // Shape 4 generic: single follow-status / relationship record
        if (isFollowStatusRecord(oldData) || isRelationshipRecord(oldData)) {
          return {
            ...oldData,
            isFollowing: delta.isFollowing,
            is_following: delta.isFollowing,
            isFollowedByMe: delta.isFollowing,
            is_followed_by_me: delta.isFollowing,
          };
        }

        return oldData;
      },
    );
  }

  // Active invalidations for keys we ALWAYS want to refetch:
  //  - notifications ("X followed you" entry)
  //  - followers/following list sheets (modal, gated by enabled: isOpen)
  queryClient.invalidateQueries({ queryKey: ['notifications'] });
  queryClient.invalidateQueries({ queryKey: ['followers-list'] });
  queryClient.invalidateQueries({ queryKey: ['following-list'] });
}

/**
 * Reapplies an inverse delta — used by mutation `onError` to roll back an
 * optimistic patch. Internally just a `patchFollow` with the prior state.
 */
export function revertFollow(
  queryClient: QueryClient,
  target: FollowTarget,
  prevState: { isFollowing: boolean },
): void {
  patchFollow(queryClient, target, { isFollowing: prevState.isFollowing });
}
