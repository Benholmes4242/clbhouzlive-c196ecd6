import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
  

  const statusKey = ['business-follow-status', businessId, userId];
  const countKey = ['business-followers-count', businessId];

  const followMutation = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('Must be logged in to follow');
      const { error } = await supabase
        .from('business_follows')
        .insert({ business_id: businessId, follower_id: userId });
      if (error) throw error;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: statusKey });
      await queryClient.cancelQueries({ queryKey: countKey });
      const prevStatus = queryClient.getQueryData<boolean>(statusKey);
      const prevCount = queryClient.getQueryData<number>(countKey);
      queryClient.setQueryData(statusKey, true);
      queryClient.setQueryData(countKey, (old: number | undefined) => (old ?? 0) + 1);
      return { prevStatus, prevCount };
    },
    onError: (_error, _vars, context) => {
      if (context) {
        queryClient.setQueryData(statusKey, context.prevStatus);
        queryClient.setQueryData(countKey, context.prevCount);
      }
      toast.error('Error', { description: 'Failed to follow business.' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: statusKey });
      queryClient.invalidateQueries({ queryKey: countKey });
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
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: statusKey });
      await queryClient.cancelQueries({ queryKey: countKey });
      const prevStatus = queryClient.getQueryData<boolean>(statusKey);
      const prevCount = queryClient.getQueryData<number>(countKey);
      queryClient.setQueryData(statusKey, false);
      queryClient.setQueryData(countKey, (old: number | undefined) => Math.max((old ?? 1) - 1, 0));
      return { prevStatus, prevCount };
    },
    onError: (_error, _vars, context) => {
      if (context) {
        queryClient.setQueryData(statusKey, context.prevStatus);
        queryClient.setQueryData(countKey, context.prevCount);
      }
      toast.error('Error', { description: 'Failed to unfollow business.' });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: statusKey });
      queryClient.invalidateQueries({ queryKey: countKey });
    },
  });

  return {
    follow: followMutation.mutate,
    unfollow: unfollowMutation.mutate,
    isFollowing: followMutation.isPending,
    isUnfollowing: unfollowMutation.isPending,
  };
}
