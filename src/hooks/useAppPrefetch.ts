/**
 * useAppPrefetch - Standalone prefetch hook
 * 
 * This hook provides prefetch capabilities without importing from the 
 * dynamically-loaded AppPrefetchProvider. It accesses the context that 
 * AppPrefetchProvider sets up, avoiding the static/dynamic import conflict.
 * 
 * The hook returns no-op functions when used outside the provider context
 * (graceful degradation for SSR or testing scenarios).
 */

import { createContext, useContext } from 'react';

// ============ Types ============

interface PrefetchContextValue {
  /** Trigger prefetch for a specific route */
  triggerPrefetch: (path: string) => void;
  /** Check if a route has been prefetched */
  isPrefetched: (path: string) => boolean;
  /** Reset all prefetch state */
  reset: () => void;
}

// ============ Shared Context ============

// This context is shared between this file and AppPrefetchProvider
// AppPrefetchProvider sets the value, this hook consumes it
export const AppPrefetchContext = createContext<PrefetchContextValue | null>(null);

// ============ Hook ============

export function useAppPrefetch(): PrefetchContextValue {
  const context = useContext(AppPrefetchContext);
  if (!context) {
    // Return no-op if not in provider (graceful fallback)
    return {
      triggerPrefetch: () => {},
      isPrefetched: () => false,
      reset: () => {},
    };
  }
  return context;
}
