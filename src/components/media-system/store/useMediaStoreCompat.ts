/**
 * Compatibility hook: uses scoped store if available via context,
 * otherwise falls back to the global singleton useMediaStore.
 * 
 * This enables media-system components to work in both:
 * - Clubhouse (global singleton)
 * - Fullscreen overlay (scoped store per instance)
 */
import { useContext } from 'react';
import { useStore } from 'zustand';
import { MediaStoreContext } from './MediaStoreContext';
import { useMediaStore as useGlobalMediaStore } from './mediaStore';
import type { MediaStoreState } from './createMediaStore';

export function useMediaStoreCompat<T>(selector: (state: MediaStoreState) => T): T {
  const scopedStore = useContext(MediaStoreContext);
  if (scopedStore) {
    return useStore(scopedStore, selector);
  }
  // Fall back to global singleton — this is the Clubhouse path
  return useGlobalMediaStore(selector as any);
}

/**
 * Get the raw store API for imperative access (getState/setState).
 * Returns scoped store if in context, otherwise the global singleton.
 */
export function useMediaStoreApiCompat() {
  const scopedStore = useContext(MediaStoreContext);
  if (scopedStore) {
    return scopedStore;
  }
  // Return global store API shape
  return null; // Callers should fall back to useMediaStore.getState()
}
