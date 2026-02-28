import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Check if the current user is following a target user
 */
export function useIsFollowingUser(
  viewerUserId: string | undefined,
  targetUserId: string | undefined
) {
  return useQuery({
    queryKey: ['user-follow-status', viewerUserId, targetUserId],
    enabled: !!viewerUserId && !!targetUserId && viewerUserId !== targetUserId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_follows')
        .select('id')
        .eq('follower_id', viewerUserId!)
        .eq('following_id', targetUserId!)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    staleTime: 60_000,
  });
}

/**
 * Follow/unfollow a user with optimistic updates
 */
export function useUserFollowMutation(
  viewerUserId: string | undefined,
  targetUserId: string | undefined
) {
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!viewerUserId || !targetUserId) throw new Error('Must be logged in to follow');

      const { error } = await supabase
        .from('user_follows')
        .insert({ follower_id: viewerUserId, following_id: targetUserId });

      if (error) throw error;
    },
    onMutate: async () => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['user-follow-status', viewerUserId, targetUserId] });
      const previousStatus = queryClient.getQueryData<boolean>(['user-follow-status', viewerUserId, targetUserId]);
      queryClient.setQueryData(['user-follow-status', viewerUserId, targetUserId], true);
      return { previousStatus };
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(['user-follow-status', viewerUserId, targetUserId], context.previousStatus);
      }
      console.error('Follow error:', error);
      toast.error("Couldn't follow");
    },
    onSettled: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['user-follow-status', viewerUserId, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['social-counts', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['social-counts', viewerUserId] });
      // Invalidate discovery exclusions so suggested users refreshes
      queryClient.invalidateQueries({ queryKey: ['discovery-exclusions'] });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!viewerUserId || !targetUserId) throw new Error('Must be logged in to unfollow');

      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', viewerUserId)
        .eq('following_id', targetUserId);

      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['user-follow-status', viewerUserId, targetUserId] });
      const previousStatus = queryClient.getQueryData<boolean>(['user-follow-status', viewerUserId, targetUserId]);
      queryClient.setQueryData(['user-follow-status', viewerUserId, targetUserId], false);
      return { previousStatus };
    },
    onError: (error, _, context) => {
      if (context?.previousStatus !== undefined) {
        queryClient.setQueryData(['user-follow-status', viewerUserId, targetUserId], context.previousStatus);
      }
      console.error('Unfollow error:', error);
      toast.error("Couldn't unfollow");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['user-follow-status', viewerUserId, targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['social-counts', targetUserId] });
      queryClient.invalidateQueries({ queryKey: ['social-counts', viewerUserId] });
      // Invalidate discovery exclusions so suggested users refreshes
      queryClient.invalidateQueries({ queryKey: ['discovery-exclusions'] });
    },
  });

  return {
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isFollowing: followMutation.isPending,
    isUnfollowing: unfollowMutation.isPending,
  };
}
