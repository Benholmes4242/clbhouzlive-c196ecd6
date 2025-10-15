import { useState, useRef, useCallback, useEffect } from 'react';
import { ExploreContentItem } from '@/components/explore/types';

const POOL_SIZE = 16;
const RECENT_HISTORY_SIZE = 20;
const REFILL_THRESHOLD = 10;

/**
 * Hook to manage a pool of shorts suggestions from real data
 * Returns a next() function to get the next available short
 */
export function useShortsSuggestions(shortsData: ExploreContentItem[] = [], opts?: { prefetch?: () => void; hasMore?: boolean }) {
  const poolRef = useRef<ExploreContentItem[]>([]);
  const recentIdsRef = useRef<Set<string>>(new Set());
  const [initialized, setInitialized] = useState(false);

  const refillPool = useCallback(() => {
    // Get available suggestions that aren't in recent history
    const available = shortsData.filter(s => !recentIdsRef.current.has(s.id));
    
    // If we've exhausted all suggestions, reset the recent history
    if (available.length === 0) {
      recentIdsRef.current.clear();
      poolRef.current = [...shortsData];
      return;
    }
    
    // Shuffle and add to pool
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    const toAdd = shuffled.slice(0, POOL_SIZE - poolRef.current.length);
    poolRef.current.push(...toAdd);
  }, [shortsData]);

  const next = useCallback((avoidIds: Set<string> = new Set()): ExploreContentItem | null => {
    // Refill if running low
    if (poolRef.current.length < REFILL_THRESHOLD) {
      if (import.meta.env.DEV) {
        console.debug('[ShortsPool] Refilling pool, current size:', poolRef.current.length);
      }
      refillPool();
      // Proactively prefetch next page if available
      if (opts?.hasMore) {
        opts.prefetch?.();
        if (import.meta.env.DEV) console.debug('[ShortsPool] Prefetch requested');
      }
    }
    
    // Find first item not in avoid list
    const index = poolRef.current.findIndex(item => !avoidIds.has(item.id));
    if (index === -1) {
      if (opts?.hasMore) {
        opts.prefetch?.();
        if (import.meta.env.DEV) console.debug('[ShortsPool] No match, prefetch requested');
      }
      if (import.meta.env.DEV) {
        console.warn('[ShortsPool] No available shorts! Pool size:', poolRef.current.length, 
          'avoidIds:', avoidIds.size, 'totalShorts:', shortsData.length);
      }
      return null;
    }
    
    // Remove and return the item
    const [item] = poolRef.current.splice(index, 1);
    
    // Add to recent history
    recentIdsRef.current.add(item.id);
    
    // Keep recent history at max size
    if (recentIdsRef.current.size > RECENT_HISTORY_SIZE) {
      const arr = Array.from(recentIdsRef.current);
      recentIdsRef.current = new Set(arr.slice(-RECENT_HISTORY_SIZE));
    }
    
    if (import.meta.env.DEV) {
      console.debug('[ShortsPool] Dispensed short:', item.id, 'Pool remaining:', poolRef.current.length);
    }
    
    return item;
  }, [refillPool, shortsData.length, opts?.hasMore, opts?.prefetch]);

  // Initialize/reinitialize pool when data changes
  useEffect(() => {
    if (shortsData.length > 0) {
      // Reset if data changed
      poolRef.current = [];
      recentIdsRef.current.clear();
      refillPool();
      if (!initialized) {
        setInitialized(true);
      }
    }
  }, [shortsData.length, initialized, refillPool]);

  return { next };
}
