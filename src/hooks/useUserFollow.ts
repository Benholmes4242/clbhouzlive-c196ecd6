import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';
import { toast } from 'sonner';
import { useFollowStore } from '@/store/followStore';

/**
 * Hook to manage user follows
 * Provides follow state and toggle function with optimistic updates
 * Syncs across all pages via Zustand follow store + React Query cache
 */
export function useUserFollow(targetUserId: string | null) {
  const { user } = useSupabaseSession();
  const queryClient = useQueryClient();
  const { setFollowing, getFollowing } = useFollowStore();

  // Query: Check if current user follows this user
  const { data: rawIsFollowing = false, isLoading } = useQuery({
    queryKey: ['user-follows', user?.id, targetUserId],
    queryFn: async () => {
      if (!user?.id || !targetUserId || user.id === targetUserId) {
        return false;
      }
      
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error checking follow status:', error);
        return false;
      }
      
      return !!data;
    },
    enabled: !!user?.id && !!targetUserId && user.id !== targetUserId,
    staleTime: 1000 * 60,
  });

  // Read from global store first, fall back to server data
  const isFollowing = getFollowing(targetUserId ?? '', rawIsFollowing);

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
      await queryClient.cancelQueries({ queryKey: ['user-follows', user?.id, targetUserId] });
      const previousFollowState = queryClient.getQueryData(['user-follows', user?.id, targetUserId]);
      queryClient.setQueryData(['user-follows', user?.id, targetUserId], action === 'follow');
      setFollowing(targetUserId, action === 'follow');
      return { previousFollowState };
    },
    onError: (err, { targetUserId }, context) => {
      if (context?.previousFollowState !== undefined) {
        queryClient.setQueryData(['user-follows', user?.id, targetUserId], context.previousFollowState);
        setFollowing(targetUserId, context.previousFollowState as boolean);
      }
      toast.error('Failed to update follow status');
      console.error('Follow mutation error:', err);
    },
    onSuccess: (_, { targetUserId, action }) => {
      queryClient.setQueryData(['user-follows', user?.id, targetUserId], action === 'follow');
      queryClient.invalidateQueries({ queryKey: ['user-follows'] });
      queryClient.invalidateQueries({ queryKey: ['followers'] });
      queryClient.invalidateQueries({ queryKey: ['following'] });
      queryClient.invalidateQueries({ queryKey: ['social-counts'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['relationship-status'] });
      queryClient.invalidateQueries({ queryKey: ['media-feed'] });
      toast.success(action === 'follow' ? 'Following' : 'Unfollowed');
    },
  });

  // Toggle function
  const toggleFollow = (overrideTargetId?: string) => {
    const targetId = overrideTargetId || targetUserId;
    
    if (!user?.id) {
      toast.error('Please log in to follow users');
      return;
    }
    
    if (!targetId) {
      console.warn('No user ID provided');
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
