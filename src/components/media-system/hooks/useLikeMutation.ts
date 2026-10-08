import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { patchEngagement, seedViewerInLikers } from '@/lib/engagementCache';
import { useActiveActor } from '@/context/ActiveActorContext';

interface LikeMutationParams {
  postId: string;
  userId: string;
  actorId: string;
  actorType: 'personal' | 'business';
  isLiked: boolean; // current state BEFORE toggle
}

export function useLikeMutation() {
  const queryClient = useQueryClient();
  const { availableActors } = useActiveActor();

  return useMutation({
    mutationFn: async ({ postId, actorId, actorType, isLiked }: LikeMutationParams) => {
      // Canonical write path; the server (toggle_post_like) decides the store.
      // content_reactions HAS actor columns (actor_type/actor_id, unique on
      // target + actor), so a like on a round-backed post lands there against
      // whs_score_id and on a review-backed post against source_review_id
      // (R3.1), carrying the actor passed here. Rows already written to
      // post_likes by business actors stay there until a separate migration
      // moves them, which is why usePostLikes still stitches both stores.
      // Idempotent in both directions. The RPC body is server-side and was
      // changed this evening: this comment states the contract, not a reading
      // of the deployed SQL.
      const { error } = await supabase.rpc('toggle_post_like', {
        p_post_id: postId,
        p_liked: !isLiked,
        p_actor_type: actorType,
        p_actor_id: actorId,
      });
      if (error) throw error;
    },
    // Viewer seed: the likers list moves on the same tap as the count.
    onMutate: ({ postId, userId, actorId, actorType, isLiked }: LikeMutationParams) => {
      const a = availableActors.find((x) => x.id === actorId && x.type === actorType);
      const revertLikers = seedViewerInLikers(queryClient, postId, 'post', {
        userId, actorType, actorId,
        name: a?.name ?? null,
        avatarUrl: a?.avatarUrl ?? null,
        slug: a?.slug ?? null,
      }, !isLiked);
      return { revertLikers };
    },
    onError: (error, _vars, ctx) => {
      console.error('[Like] Mutation failed:', error);
      ctx?.revertLikers?.();
    },
    onSuccess: (_data, variables) => {
      // Patch cache ONLY after a confirmed successful write. Previously this
      // ran in onSettled which fires on error too, leaving the cache in a
      // "liked" state when no DB row existed.
      patchEngagement(queryClient, variables.postId, {
        isLikedByMe: !variables.isLiked,
        likeCountDelta: variables.isLiked ? -1 : +1,
      });
      /* A ROUND POST'S LIKE LIVES IN content_reactions (the RPC routes it
         there), which is what the Discover cards, the see-all sheet and the
         scorecard sheet read. Invalidating that family makes the heart agree on
         every surface without a manual refresh
         (BRIEF_ROUND_COMMENTS_EVERYWHERE §S3.1). */
    },
    onSettled: (_d, _e, variables) => {
      // TWO READINGS OF ONE FACT: ['content-reactions'] and ['post-likes'] both
      // report this like — refresh them together, by prefix (no source), from
      // both write paths.
      queryClient.invalidateQueries({ queryKey: ['content-reactions'] });
      queryClient.invalidateQueries({ queryKey: ['post-likes', variables.postId] });
    },
  });
}

