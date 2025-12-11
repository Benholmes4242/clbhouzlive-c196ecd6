import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';

/**
 * Check if current user is following a business
 */
export function useIsFollowingBusiness(businessId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['business-follow-status', businessId, userId],
    enabled: !!businessId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_follows')
        .select('id')
        .eq('business_id', businessId!)
        .eq('follower_id', userId!)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    staleTime: 60_000,
  });
}

/**
 * Get follower count for a business
 */
export function useBusinessFollowersCount(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-followers-count', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('business_follows')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId!);

      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });
}

/**
 * Follow/unfollow a business
 */
export function useBusinessFollowMutation(businessId: string, userId: string | undefined) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Must be logged in to follow');

      const { error } = await supabase
        .from('business_follows')
        .insert({ business_id: businessId, follower_id: userId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-follow-status', businessId, userId] });
      queryClient.invalidateQueries({ queryKey: ['business-followers-count', businessId] });
    },
    onError: (error: Error) => {
      console.error('Follow error:', error);
      toast({
        title: 'Error',
        description: 'Failed to follow business. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const unfollowMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Must be logged in to unfollow');

      const { error } = await supabase
        .from('business_follows')
        .delete()
        .eq('business_id', businessId)
        .eq('follower_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['business-follow-status', businessId, userId] });
      queryClient.invalidateQueries({ queryKey: ['business-followers-count', businessId] });
    },
    onError: (error: Error) => {
      console.error('Unfollow error:', error);
      toast({
        title: 'Error',
        description: 'Failed to unfollow business. Please try again.',
        variant: 'destructive',
      });
    },
  });

  return {
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isFollowing: followMutation.isPending,
    isUnfollowing: unfollowMutation.isPending,
  };
}
