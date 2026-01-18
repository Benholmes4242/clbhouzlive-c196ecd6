import { useCallback, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type FollowState = 'following' | 'not_following' | 'unknown';

export function useFollow(targetUserId: string | undefined) {
  const [busy, setBusy] = useState(false);
  const [isFollowing, setIsFollowing] = useState<FollowState>('unknown');

  // initial check
  const ensureInitial = useCallback(async () => {
    if (!targetUserId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setIsFollowing('not_following');

    const { data, error } = await supabase
      .from('user_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId)
      .maybeSingle();

    if (error) {
      console.warn('follow-check error', error);
      setIsFollowing('not_following');
      return;
    }
    setIsFollowing(data ? 'following' : 'not_following');
  }, [targetUserId]);

  const follow = useCallback(async () => {
    if (!targetUserId || busy) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }

    // optimistic
    const prev = isFollowing;
    setIsFollowing('following');

    const { error } = await supabase
      .from('user_follows')
      .upsert({ follower_id: user.id, following_id: targetUserId }, { onConflict: 'follower_id,following_id' });

    if (error) {
      // rollback
      console.warn('follow error', error);
      setIsFollowing(prev);
    }
    // Note: Notification is created automatically by database trigger
    setBusy(false);
  }, [busy, isFollowing, targetUserId]);

  const unfollow = useCallback(async () => {
    if (!targetUserId || busy) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }

    const prev = isFollowing;
    setIsFollowing('not_following');

    const { error } = await supabase
      .from('user_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', targetUserId);

    if (error) {
      console.warn('unfollow error', error);
      setIsFollowing(prev);
    }
    setBusy(false);
  }, [busy, isFollowing, targetUserId]);

  const toggle = useCallback(async () => {
    if (isFollowing === 'following') return unfollow();
    if (isFollowing === 'not_following') return follow();
  }, [isFollowing, follow, unfollow]);

  return useMemo(() => ({
    isFollowing, busy, follow, unfollow, toggle, ensureInitial
  }), [isFollowing, busy, follow, unfollow, toggle, ensureInitial]);
}
