/**
 * useProfilePrefetch - Hook for hover/touch prefetch of profile videos
 * 
 * Matches Watch tab performance by prefetching profile videos BEFORE navigation,
 * triggered on hover (desktop) or touch start (mobile).
 * 
 * Usage:
 *   const { onPrefetch, prefetchHandlers } = useProfilePrefetch(userId);
 *   <Button onMouseEnter={onPrefetch} onTouchStart={onPrefetch}>View Profile</Button>
 *   // Or spread handlers:
 *   <Avatar {...prefetchHandlers} />
 */

import { useCallback, useMemo } from 'react';
import { prefetchProfileVideos } from '@/utils/profileVideoPrefetch';

interface UseProfilePrefetchOptions {
  /** User ID to prefetch videos for. If undefined, prefetches current user's profile */
  userId?: string;
  /** Whether prefetch is enabled. Defaults to true */
  enabled?: boolean;
}

interface PrefetchHandlers {
  onMouseEnter: () => void;
  onTouchStart: () => void;
}

interface UseProfilePrefetchResult {
  /** Single prefetch handler - call on hover or touch */
  onPrefetch: () => void;
  /** Object with onMouseEnter and onTouchStart handlers for spreading */
  prefetchHandlers: PrefetchHandlers;
}

export function useProfilePrefetch(
  options: UseProfilePrefetchOptions | string | undefined = {}
): UseProfilePrefetchResult {
  // Support both object options and direct userId string
  const { userId, enabled = true } = typeof options === 'string' 
    ? { userId: options, enabled: true }
    : { userId: options?.userId ?? options, enabled: options?.enabled ?? true } as { userId?: string; enabled: boolean };

  const onPrefetch = useCallback(() => {
    if (!enabled) {
      console.log('[ProfilePrefetch] Skipped - disabled');
      return;
    }

    console.log('[ProfilePrefetch] Hover/touch triggered for:', userId || 'current user');
    
    prefetchProfileVideos(userId).then(ids => {
      if (ids && ids.length > 0) {
        console.log('[ProfilePrefetch] ✅ Prefetched', ids.length, 'videos');
      }
    }).catch(err => {
      console.warn('[ProfilePrefetch] Failed:', err);
    });
  }, [userId, enabled]);

  const prefetchHandlers = useMemo<PrefetchHandlers>(() => ({
    onMouseEnter: onPrefetch,
    onTouchStart: onPrefetch,
  }), [onPrefetch]);

  return {
    onPrefetch,
    prefetchHandlers,
  };
}

export default useProfilePrefetch;
