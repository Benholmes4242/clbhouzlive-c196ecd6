import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { toast } from 'sonner';

/**
 * Hook to manage creator engagement (follows)
 * Provides follow state and toggle function with optimistic updates
 * Syncs across all pages via React Query cache
 */
export function useCreatorEngagement(creatorId: string | null) {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();

  // Query: Check if current user follows this creator
  const { data: isFollowing = false, isLoading } = useQuery({
    queryKey: ['user-follows', user?.id, creatorId],
    queryFn: async () => {
      if (!user?.id || !creatorId || user.id === creatorId) {
        return false;
      }
      
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', creatorId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user?.id && !!creatorId && user.id !== creatorId,
    staleTime: 1000 * 60, // 1 minute
  });

  // Mutation: Toggle follow/unfollow
  const followMutation = useMutation({
    mutationFn: async ({ targetUserId, action }: { targetUserId: string; action: 'follow' | 'unfollow' }) => {
      if (!user?.id) {
        throw new Error('You must be logged in to follow users');
      }
      
      if (action === 'follow') {
        const { data, error } = await supabase
          .from('user_follows')
          .insert({ 
            follower_id: user.id, 
            following_id: targetUserId 
          })
          .select()
          .single();
        
        if (error) throw error;

        // Create notification for the person being followed
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          type: 'follow',
          actor_id: user.id,
          title: 'New follower',
          message: 'started following you',
          data: { follower_id: user.id },
        });

        return data;
      } else {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', targetUserId);
        
        if (error) throw error;
        return null;
      }
    },
    onMutate: async ({ targetUserId, action }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['user-follows', user?.id, targetUserId] });
      
      // Snapshot previous value
      const previousFollowState = queryClient.getQueryData(['user-follows', user?.id, targetUserId]);
      
      // Optimistically update
      queryClient.setQueryData(['user-follows', user?.id, targetUserId], action === 'follow');
      
      return { previousFollowState };
    },
    onError: (err, { targetUserId }, context) => {
      // Rollback on error
      if (context?.previousFollowState !== undefined) {
        queryClient.setQueryData(['user-follows', user?.id, targetUserId], context.previousFollowState);
      }
      toast.error('Failed to update follow status');
      console.error('Follow mutation error:', err);
    },
    onSuccess: (_, { targetUserId, action }) => {
      // Update cache
      queryClient.setQueryData(['user-follows', user?.id, targetUserId], action === 'follow');
      
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user-follows'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['social-counts'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      
      // Show success message
      toast.success(action === 'follow' ? 'Following!' : 'Unfollowed');
    },
  });

  // Toggle function
  const toggleFollow = (targetCreatorId?: string) => {
    const targetId = targetCreatorId || creatorId;
    
    if (!user?.id) {
      toast.error('Please log in to follow users');
      return;
    }
    
    if (!targetId) {
      console.warn('No creator ID provided');
      return;
    }
    
    if (user.id === targetId) {
      toast.error("You can't follow yourself");
      return;
    }
    
    followMutation.mutate({
      targetUserId: targetId,
      action: isFollowing ? 'unfollow' : 'follow',
    });
  };

  return {
    isFollowing,
    isLoading,
    toggleFollow,
    isFollowingPending: followMutation.isPending,
  };
}
