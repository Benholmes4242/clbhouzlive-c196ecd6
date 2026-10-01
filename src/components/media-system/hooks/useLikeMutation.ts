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
      // Canonical write path. The server decides the store: a PERSONAL like on a
      // post created from a synced round records into content_reactions
      // (target_type='round'), a PERSONAL like on a review-backed post into
      // content_reactions (target_type='review', target_id = source_review_id,
      // exactly what the Explore review tile writes — R3.1). Business-actor
      // likes and everything else go to post_likes, because content_reactions
      // has no actor columns. Idempotent in both directions.
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

