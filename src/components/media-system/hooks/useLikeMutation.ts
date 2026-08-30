import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { patchEngagement } from '@/lib/engagementCache';

interface LikeMutationParams {
  postId: string;
  userId: string;
  actorId: string;
  actorType: 'personal' | 'business';
  isLiked: boolean; // current state BEFORE toggle
}

export function useLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ postId, actorId, actorType, isLiked }: LikeMutationParams) => {
      // Canonical write path. The server decides the store: posts created from a
      // synced round record into content_reactions (target_type='round'),
      // everything else into post_likes. Idempotent in both directions.
      const { error } = await supabase.rpc('toggle_post_like', {
        p_post_id: postId,
        p_liked: !isLiked,
        p_actor_type: actorType,
        p_actor_id: actorId,
      });
      if (error) throw error;
    },
    onError: (error) => {
      console.error('[Like] Mutation failed:', error);
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
      queryClient.invalidateQueries({ queryKey: ['content-reactions'] });
    },
  });
}

