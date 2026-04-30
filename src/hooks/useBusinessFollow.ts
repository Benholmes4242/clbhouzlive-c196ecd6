/**
 * @deprecated Use `useFollowState` (read) + `useToggleFollow` (write) directly.
 * Wrapper preserved for PR 3 incremental migration.
 *
 * Keeps the legacy 3-element ['business-follow-status', businessId, userId]
 * cache key for backward-compat. patchFollow walks that key in
 * FOLLOW_CACHE_KEYS so optimistic updates from useToggleFollow propagate here.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useToggleFollow } from '@/hooks/useToggleFollow';

export function useIsFollowingBusiness(businessId: string | undefined, userId: string | undefined) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn('[deprecated] useIsFollowingBusiness → migrate to useFollowState');
  }
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['business-follow-status', businessId, userId],
    enabled: !!businessId && !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('business_follows')
        .select('id')
        .eq('business_id', businessId ?? '')
        .eq('follower_id', userId ?? '')
        .maybeSingle();
      if (error) throw error;
      const result = !!data;
      // Seed canonical 5-element key for useFollowState readers.
      queryClient.setQueryData(
        ['follow-status', 'personal', userId, 'business', businessId],
        { isFollowing: result },
      );
      return result;
    },
    staleTime: 60_000,
  });
}

export function useBusinessFollowersCount(businessId: string | undefined) {
  return useQuery({
    queryKey: ['business-followers-count', businessId],
    enabled: !!businessId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('business_follows')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId ?? '');
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 60_000,
  });
}

export function useBusinessFollowMutation(businessId: string, userId: string | undefined) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn('[deprecated] useBusinessFollowMutation → migrate to useToggleFollow');
  }
  const queryClient = useQueryClient();
  const toggle = useToggleFollow();
  const countKey = ['business-followers-count', businessId];

  const run = (isFollowing: boolean) => {
    if (!userId) {
      toast.error('Please sign in');
      return;
    }
    // Optimistic count bump (canonical key handled by patchFollow).
    queryClient.setQueryData<number | undefined>(countKey, (old) =>
      Math.max(0, (old ?? 0) + (isFollowing ? -1 : 1)),
    );
    toggle.mutate(
      {
        targetActorType: 'business',
        targetActorId: businessId,
        targetUserId: businessId,
        viewerActorType: 'personal',
        viewerActorId: userId,
        viewerUserId: userId,
        isFollowing,
      },
      {
        onError: () => {
          // Revert count on error.
          queryClient.setQueryData<number | undefined>(countKey, (old) =>
            Math.max(0, (old ?? 0) + (isFollowing ? 1 : -1)),
          );
          toast.error('Error', {
            description: isFollowing ? 'Failed to unfollow business.' : 'Failed to follow business.',
          });
        },
      },
    );
  };

  return {
    follow: () => run(false),
    unfollow: () => run(true),
    isFollowing: toggle.isPending,
    isUnfollowing: toggle.isPending,
  };
}
