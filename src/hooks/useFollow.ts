/**
 * @deprecated Use `useToggleFollow` + `useFollowState` directly.
 * Wrapper preserved for PR 3 incremental migration. Will be deleted in a
 * follow-up cleanup PR after console.warn confirms zero usage.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useFollowState } from '@/hooks/useFollowState';
import { useSupabaseSession } from './useSupabaseSession';

type FollowState = 'following' | 'not_following' | 'unknown';

export function useFollow(targetUserId: string | undefined) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn('[deprecated] useFollow → migrate to useToggleFollow + useFollowState');
  }

  const { user } = useSupabaseSession();
  const toggle = useToggleFollow();
  const { isFollowing: cached } = useFollowState({
    targetActorType: 'personal',
    targetActorId: targetUserId,
    viewerActorType: 'personal',
    viewerActorId: user?.id,
  });

  const [resolved, setResolved] = useState<boolean | undefined>(cached);

  useEffect(() => {
    if (cached !== undefined) setResolved(cached);
  }, [cached]);

  const ensureInitial = useCallback(async () => {
    if (!targetUserId || !user?.id) {
      setResolved(false);
      return;
    }
    if (cached !== undefined) {
      setResolved(cached);
      return;
    }
    const { data } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();
    setResolved(!!data);
  }, [targetUserId, user?.id, cached]);

  const isFollowing: FollowState =
    resolved === undefined ? 'unknown' : resolved ? 'following' : 'not_following';

  const callToggle = useCallback(
    async (next: boolean) => {
      if (!targetUserId || !user?.id) return;
      await toggle.mutateAsync({
        targetActorType: 'personal',
        targetActorId: targetUserId,
        targetUserId: targetUserId,
        viewerActorType: 'personal',
        viewerActorId: user.id,
        viewerUserId: user.id,
        isFollowing: !next, // current state is the inverse of desired
      });
    },
    [targetUserId, user?.id, toggle],
  );

  const follow = useCallback(() => callToggle(true), [callToggle]);
  const unfollow = useCallback(() => callToggle(false), [callToggle]);

  const handleToggle = useCallback(() => {
    if (isFollowing === 'following') return unfollow();
    if (isFollowing === 'not_following') return follow();
  }, [isFollowing, follow, unfollow]);

  return useMemo(
    () => ({
      isFollowing,
      busy: toggle.isPending,
      follow,
      unfollow,
      toggle: handleToggle,
      ensureInitial,
    }),
    [isFollowing, toggle.isPending, follow, unfollow, handleToggle, ensureInitial],
  );
}
