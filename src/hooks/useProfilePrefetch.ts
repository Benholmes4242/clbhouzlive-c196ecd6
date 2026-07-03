/**
 * useProfilePrefetch — inert stub (Stage E teardown).
 * Video prefetch is severed; the hook keeps its API surface so hover/touch
 * consumers continue to compile with no runtime work.
 */
import { useMemo, useCallback } from 'react';

interface UseProfilePrefetchOptions {
  userId?: string;
  enabled?: boolean;
}

interface PrefetchHandlers {
  onMouseEnter: () => void;
  onTouchStart: () => void;
}

interface UseProfilePrefetchResult {
  onPrefetch: () => void;
  prefetchHandlers: PrefetchHandlers;
}

export function useProfilePrefetch(
  _options: UseProfilePrefetchOptions | string | undefined = {},
): UseProfilePrefetchResult {
  const onPrefetch = useCallback(() => {}, []);
  const prefetchHandlers = useMemo<PrefetchHandlers>(
    () => ({ onMouseEnter: onPrefetch, onTouchStart: onPrefetch }),
    [onPrefetch],
  );
  return { onPrefetch, prefetchHandlers };
}

export default useProfilePrefetch;
