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
        const { error } = await supabase
          .from('post_likes')
          .insert({
            post_id: postId,
            user_id: userId,
            actor_id: actorId,
            actor_type: actorType,
          });

        // `23505` is Postgres' unique_violation. This can happen if the user
        // double-taps the like button before the optimistic state settles, or if
        // a stale isLiked=false state tries to re-insert a row that already exists.
        // Treat it as a no-op rather than an error — the like already exists.
        if (error && error.code !== '23505') throw error;
      }
    },
    onError: (error) => {
      console.error('[Like] Mutation failed:', error);
    },
    onSettled: (_data, _error, variables) => {
      // Surgical cache patch across every feed key — no refetch, no scroll
      // jump, every consumer surface stays in sync. See `engagementCache.ts`.
      // `variables.isLiked` is the state BEFORE toggle; new state is opposite.
      patchEngagement(queryClient, variables.postId, {
        isLikedByMe: !variables.isLiked,
        likeCountDelta: variables.isLiked ? -1 : +1,
      });
    },
  });
}
