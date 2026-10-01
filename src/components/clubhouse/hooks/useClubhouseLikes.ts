import { useState, useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useActiveActor } from '@/context/ActiveActorContext';
import type { PostLiker } from '@/hooks/usePostLikes';
import type { FeedPost } from '@/components/media-system/types/media';
import { useLikeMutation } from '@/components/media-system/hooks/useLikeMutation';
import { analyticsEvents } from '@/utils/analyticsEvents';

interface UseClubhouseLikesOptions {
  userId: string | undefined;
  activeActor: { id: string; type: string } | null;
}

/**
 * Manages PENDING optimistic like state for the Clubhouse feed.
 *
 * Post-engagementCache refactor: the Map only holds in-flight optimistic
 * overrides. Once the mutation settles, `patchEngagement` updates the post
 * prop directly via the cache, and we clear the override. Display falls back
 * to the (now-fresh) post prop.
 */
export function useClubhouseLikes({ userId, activeActor }: UseClubhouseLikesOptions) {
  const likeMutation = useLikeMutation();
  const queryClient = useQueryClient();
  const { activeActor: ctxActor } = useActiveActor();
  const [localLikeState, setLocalLikeState] = useState<Map<string, { isLiked: boolean; count: number }>>(new Map());

  // Clear any pending optimistic overrides when the active actor changes so
  // the new actor's fresh post data isn't briefly painted with the previous
  // actor's liked/count state.
  useEffect(() => {
    setLocalLikeState(new Map());
  }, [activeActor?.id, activeActor?.type]);

  const clearOverride = useCallback((postId: string) => {
    setLocalLikeState(prev => {
      if (!prev.has(postId)) return prev;
      const next = new Map(prev);
      next.delete(postId);
      return next;
    });
  }, []);

  const handleLike = useCallback((post: FeedPost | null) => {
    const actor = activeActor;
    if (!userId || !post || !actor) return;

    const wasLiked = post.isLikedByMe;

    // ── LIKERS SEED ── The viewer is the one liker we never need to ask the
    // server about. The same tap that writes the count override writes the
    // viewer into (or out of) the likers cache, so figure and names come from
    // one place and cannot disagree. Snapshot every source for rollback.
    const isBusiness = actor.type === 'business';
    const actorId = actor.id ?? userId;
    const full = ctxActor && ctxActor.id === actorId && ctxActor.type === actor.type ? ctxActor : null;
    const isMe = (l: PostLiker) =>
      (l.actorType ?? 'personal') === (isBusiness ? 'business' : 'personal') &&
      (l.actorId ?? l.userId) === actorId;
    const likerKeyPrefix = ['post-likes', post.id] as const;
    const snapshots = queryClient.getQueriesData<PostLiker[]>({ queryKey: likerKeyPrefix });
    const seedKey = ['post-likes', post.id, 'post'];
    const hadSeedKey = queryClient.getQueryData(seedKey) !== undefined;
    const me: PostLiker = {
      userId: isBusiness ? userId : actorId,
      displayName: full?.name ?? '',
      username: (isBusiness ? (full as any)?.slug : null) ?? full?.name ?? '',
      avatarUrl: full?.avatarUrl ?? null,
      actorType: isBusiness ? 'business' : 'personal',
      actorId,
    };
    const apply = (list: PostLiker[] | undefined): PostLiker[] => {
      const rest = (list ?? []).filter((l) => !isMe(l));
      return wasLiked ? rest : [me, ...rest];
    };
    // Existing caches under any source…
    queryClient.setQueriesData<PostLiker[]>({ queryKey: likerKeyPrefix }, (old) => (old ? apply(old) : old));
    // …and the feed's own 'post' key even when no fetch has happened yet (a
    // first like on a zero-like post is what first enables that query).
    if (!hadSeedKey && !wasLiked) queryClient.setQueryData<PostLiker[]>(seedKey, [me]);
    const revertLikers = () => {
      for (const [key, data] of snapshots) queryClient.setQueryData(key, data);
      if (!hadSeedKey) queryClient.removeQueries({ queryKey: seedKey, exact: true });
    };

    // Optimistic override for instant feedback before mutation settles.
    setLocalLikeState(prev => new Map(prev).set(post.id, {
      isLiked: !wasLiked,
      count: Math.max(0, post.likeCount + (wasLiked ? -1 : 1)),
    }));

    analyticsEvents.track('video_like', { post_id: post.id, action: wasLiked ? 'unlike' : 'like' });
    analyticsEvents.track('post_like', { post_id: post.id, action: wasLiked ? 'unlike' : 'like' });

    likeMutation.mutate(
      {
        postId: post.id,
        userId,
        actorId: actor.id ?? userId,
        actorType: actor.type === 'business' ? 'business' : 'personal',
        isLiked: wasLiked,
      },
      {
        // Success: cache has been patched to truth — drop the override.
        onSuccess: () => clearOverride(post.id),
        // Error: explicitly revert to the PRE-TAP state. The post prop was
        // never patched (patchEngagement runs only on success now), so a
        // simple clear is also safe — but pinning the pre-tap value makes
        // the rollback unambiguous even if upstream caches drift.
        onError: () => {
          revertLikers();
          setLocalLikeState(prev => new Map(prev).set(post.id, {
            isLiked: wasLiked,
            count: post.likeCount,
          }));
          // Drop the override on the next tick so the post prop (truth) takes over.
          setTimeout(() => clearOverride(post.id), 0);
        },
      }
    );

  }, [userId, activeActor, ctxActor, queryClient, likeMutation, clearOverride]);

  const getActiveLikeState = useCallback((post: FeedPost | null) => {
    if (!post) return { isLiked: false, count: 0 };
    const pending = localLikeState.get(post.id);
    if (pending) return pending;
    return { isLiked: post.isLikedByMe, count: post.likeCount };
  }, [localLikeState, activeActor?.id, activeActor?.type]);

  const resetLikes = useCallback(() => {
    setLocalLikeState(new Map());
  }, []);

  return { handleLike, getActiveLikeState, resetLikes };
}
