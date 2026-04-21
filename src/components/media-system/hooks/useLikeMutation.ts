import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
          .upsert(
            { post_id: postId, user_id: userId, actor_id: actorId, actor_type: actorType },
            { onConflict: 'post_id,actor_type,actor_id', ignoreDuplicates: true }
          );
        if (error) throw error;
      }
    },
    onError: (error) => {
      console.error('[Like] Mutation failed:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-post-likes'] });
      // Mark feed caches stale without active refetch — optimistic state in
      // useClubhouseLikes drives the UI. An active refetch here would re-order
      // posts and combined with scroll-snap-type: y mandatory cause the feed
      // to jump to a different slide. Next natural refetch (tab switch, PTR,
      // route re-entry) will sync with the server.
      queryClient.invalidateQueries({ queryKey: ['media-feed', 'suggested'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['media-feed', 'friends'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['explore-posts'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['watch-feed'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['profile-posts'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['real-posts'], refetchType: 'none' });
      queryClient.invalidateQueries({ queryKey: ['actor-posts'], refetchType: 'none' });
    },
  });
}
