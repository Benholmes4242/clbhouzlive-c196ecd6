import { useCallback, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type FollowState = 'following' | 'not_following' | 'unknown';

/**
 * Hook for following/unfollowing creator pages (entity-based)
 * Uses creator_follows table, not user_follows
 */
export function useCreatorFollow(creatorPageId: string | undefined) {
  const [busy, setBusy] = useState(false);
  const [isFollowing, setIsFollowing] = useState<FollowState>('unknown');

  // initial check
  const ensureInitial = useCallback(async () => {
    if (!creatorPageId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setIsFollowing('not_following');

    const { data, error } = await supabase
      .from('creator_follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('creator_page_id', creatorPageId)
      .maybeSingle();

    if (error) {
      console.warn('creator-follow-check error', error);
      setIsFollowing('not_following');
      return;
    }
    setIsFollowing(data ? 'following' : 'not_following');
  }, [creatorPageId]);

  const follow = useCallback(async () => {
    if (!creatorPageId || busy) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }

    // optimistic
    const prev = isFollowing;
    setIsFollowing('following');

    const { error } = await supabase
      .from('creator_follows')
      .upsert(
        { follower_id: user.id, creator_page_id: creatorPageId },
        { onConflict: 'follower_id,creator_page_id' }
      );

    if (error) {
      // rollback
      console.warn('creator follow error', error);
      setIsFollowing(prev);
    }
    setBusy(false);
  }, [busy, isFollowing, creatorPageId]);

  const unfollow = useCallback(async () => {
    if (!creatorPageId || busy) return;
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return; }

    const prev = isFollowing;
    setIsFollowing('not_following');

    const { error } = await supabase
      .from('creator_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('creator_page_id', creatorPageId);

    if (error) {
      console.warn('creator unfollow error', error);
      setIsFollowing(prev);
    }
    setBusy(false);
  }, [busy, isFollowing, creatorPageId]);

  const toggle = useCallback(async () => {
    if (isFollowing === 'following') return unfollow();
    if (isFollowing === 'not_following') return follow();
  }, [isFollowing, follow, unfollow]);

  return useMemo(() => ({
    isFollowing, busy, follow, unfollow, toggle, ensureInitial
  }), [isFollowing, busy, follow, unfollow, toggle, ensureInitial]);
}
