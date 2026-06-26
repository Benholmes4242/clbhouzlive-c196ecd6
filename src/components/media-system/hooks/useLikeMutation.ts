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
    mutationFn: async ({ postId, userId, actorId, actorType, isLiked }: LikeMutationParams) => {
      if (isLiked) {
        const { error } = await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('actor_id', actorId)
          .eq('actor_type', actorType);
        if (error) throw error;
      } else {
        // Idempotent upsert — guarantees a row exists for this actor after success.
        // Avoids the 409 unique-violation that previously got swallowed as success
        // while no row was actually written (likes "lost" on refresh).
        const { error } = await supabase
          .from('post_likes')
          .upsert(
            {
              post_id: postId,
              user_id: userId,
              actor_id: actorId,
              actor_type: actorType,
            },
            { onConflict: 'post_id,actor_type,actor_id', ignoreDuplicates: true },
          );
        if (error) throw error;
      }
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
    },
  });
}

