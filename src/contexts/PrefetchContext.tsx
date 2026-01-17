/**
 * PrefetchContext - Provides route-level video prefetching
 * 
 * Exposes triggerPrefetch for navigation components to call on hover/focus
 */

import React, { createContext, useContext } from 'react';

interface PrefetchContextValue {
  /** Trigger prefetch for a specific route path */
  triggerPrefetch: (path: string) => void;
  /** Check if a route has been prefetched */
  isPrefetched: (path: string) => boolean;
  /** Reset prefetch state */
  reset: () => void;
}

const PrefetchContext = createContext<PrefetchContextValue | null>(null);

export function usePrefetch(): PrefetchContextValue {
  const context = useContext(PrefetchContext);
  if (!context) {
    // Return no-op if not in provider (graceful degradation)
    return { 
      triggerPrefetch: () => {}, 
      isPrefetched: () => false,
      reset: () => {},
    };
  }
  return context;
}

export { PrefetchContext };
export type { PrefetchContextValue };
