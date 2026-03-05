import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface FollowParams {
  targetUserId: string;
  targetActorType: 'personal' | 'business';
  targetActorId: string;
  currentUserId: string;
  isFollowed: boolean; // current state BEFORE toggle
}

export function useFollowMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ targetUserId, targetActorType, targetActorId, currentUserId, isFollowed }: FollowParams) => {
      if (targetActorType === 'business') {
        if (isFollowed) {
          const { error } = await supabase
            .from('business_follows')
            .delete()
            .eq('follower_id', currentUserId)
            .eq('business_id', targetActorId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('business_follows')
            .insert({ follower_id: currentUserId, business_id: targetActorId });
          if (error) throw error;
        }
      } else {
        if (isFollowed) {
          const { error } = await supabase
            .from('user_follows')
            .delete()
            .eq('follower_id', currentUserId)
            .eq('following_id', targetUserId);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('user_follows')
            .insert({ follower_id: currentUserId, following_id: targetUserId });
          if (error) throw error;
        }
      }
    },
    onError: (error) => {
      console.error('[Follow] Mutation failed:', error);
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ['media-feed'],
        refetchType: 'none',
      });
    },
  });
}
