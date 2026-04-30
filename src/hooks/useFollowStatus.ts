/**
 * @deprecated Use `useFollowState` from '@/hooks/useFollowState' (per-target).
 * For batch use cases, seed the canonical 5-element cache key directly.
 * This wrapper preserves the legacy batch API during PR 3 migration.
 */
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseSession } from './useSupabaseSession';

export function useFollowStatus(userIds: string[]) {
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.warn('[deprecated] useFollowStatus → migrate to useFollowState');
  }
  const { user } = useSupabaseSession();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || userIds.length === 0) {
      setLoading(false);
      return;
    }

    const fetchFollowStatus = async () => {
      const { data } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .in('following_id', userIds);

      if (data) {
        setFollowingIds(new Set(data.map(f => f.following_id)));
      }
      setLoading(false);
    };

    fetchFollowStatus();
  }, [user, userIds.join(',')]);

  const updateFollowStatus = (userId: string, isFollowing: boolean) => {
    setFollowingIds(prev => {
      const next = new Set(prev);
      if (isFollowing) {
        next.add(userId);
      } else {
        next.delete(userId);
      }
      return next;
    });
  };

  return { followingIds, loading, updateFollowStatus };
}
