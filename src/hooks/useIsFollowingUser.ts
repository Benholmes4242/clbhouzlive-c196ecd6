/**
 * @deprecated Use `useFollowState` (read) + `useToggleFollow` (write) directly.
 * Wrapper preserved for PR 3 incremental migration.
 *
 * Note: this file still exposes the original 3-element ['user-follow-status']
 * cache key for backward-compat. patchFollow walks that key in
 * FOLLOW_CACHE_KEYS so optimistic updates from useToggleFollow propagate here.
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useToggleFollow } from '@/hooks/useToggleFollow';

export function useIsFollowingUser(
  viewerUserId: string | undefined,
  targetUserId: string | undefined,
) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn('[deprecated] useIsFollowingUser → migrate to useFollowState');
  }
  const queryClient = useQueryClient();

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
      const result = !!data;
      // Seed canonical 5-element key so useFollowState readers see it too.
      queryClient.setQueryData(
        ['follow-status', 'personal', viewerUserId, 'personal', targetUserId],
        { isFollowing: result },
      );
      return result;
    },
    staleTime: 60_000,
  });
}

export function useUserFollowMutation(
  viewerUserId: string | undefined,
  targetUserId: string | undefined,
) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn('[deprecated] useUserFollowMutation → migrate to useToggleFollow');
  }
  const toggle = useToggleFollow();

  const run = (isFollowing: boolean) => {
    if (!viewerUserId || !targetUserId) return;
    toggle.mutate(
      {
        targetActorType: 'personal',
        targetActorId: targetUserId,
        targetUserId,
        viewerActorType: 'personal',
        viewerActorId: viewerUserId,
        viewerUserId,
        isFollowing,
      },
      {
        onError: () => toast.error(isFollowing ? "Couldn't unfollow" : "Couldn't follow"),
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
