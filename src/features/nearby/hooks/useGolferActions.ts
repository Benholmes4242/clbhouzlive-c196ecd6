import { useState } from 'react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { analyticsEvents } from '@/utils/analyticsEvents';

export function useGolferActions(golferId: string, initialFollowing = false, index?: number) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const queryClient = useQueryClient();
  

  const sendFriendRequest = () => {
    if (index !== undefined) {
      analyticsEvents.track('nearby_friend_request_clicked', { 
        golfer_id: golferId, 
        position: index 
      });
    }
    
    // TODO: Implement friend request mutation when friends system is integrated
    toast('Friend system coming soon');
  };

  const followMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', golferId);
        
        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: user.id,
            follower_actor_id: user.id,
            follower_actor_type: 'personal',
            following_id: golferId
          });
        
        if (error) throw error;
      }
    },
    onMutate: async () => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['nearbyGolfers', 'live'] });
      
      // Get current data
      const previousData = queryClient.getQueryData<any[]>(['nearbyGolfers', 'live']);
      
      // Optimistically update
      queryClient.setQueryData(['nearbyGolfers', 'live'], (old: any[] = []) =>
        old.map(g => 
          g.id === golferId 
            ? { ...g, is_following: !isFollowing }
            : g
        )
      );
      
      setIsFollowing(!isFollowing);
      
      return { previousData };
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(['nearbyGolfers', 'live'], context.previousData);
      }
      setIsFollowing(!isFollowing); // Revert local state
      
      toast.error("Couldn't update follow", { description: 'Please try again' });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['nearbyGolfers', 'live'] });
    }
  });

  const toggleFollow = () => {
    if (index !== undefined) {
      analyticsEvents.track('nearby_follow_clicked', { 
        golfer_id: golferId, 
        position: index 
      });
    }
    
    followMutation.mutate();
  };

  const openMessage = () => {
    if (index !== undefined) {
      analyticsEvents.track('nearby_message_clicked', { 
        golfer_id: golferId, 
        position: index 
      });
    }
    
    // TODO: Implement message/DM navigation
    console.log('Opening message for golfer:', golferId);
    toast('Direct messaging coming soon');
  };

  return {
    sendFriendRequest,
    toggleFollow,
    openMessage,
    isFollowing,
    isLoading: followMutation.isPending,
  };
}
