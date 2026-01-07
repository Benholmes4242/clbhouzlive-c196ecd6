/**
 * usePlayerCache - In-memory cache for player preview data
 * 
 * Features:
 * - TTL-based expiration (15 min default)
 * - Inflight request deduplication
 * - Instant retrieval for cached users
 */
import { useCallback, useRef } from 'react';
import { PlayerPreviewData } from '../components/PlayerPreviewSheet';

interface CachedPlayer {
  data: PlayerPreviewData;
  cachedAt: number;
}

interface InflightRequest {
  promise: Promise<PlayerPreviewData | null>;
  userId: string;
}

const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

// Module-level cache (persists across component remounts)
const playerCache = new Map<string, CachedPlayer>();
const inflightRequests = new Map<string, InflightRequest>();

export function usePlayerCache() {
  const cacheRef = useRef(playerCache);
  const inflightRef = useRef(inflightRequests);

  /**
   * Check if we have a valid cached entry for a user
   */
  const getCached = useCallback((userId: string): PlayerPreviewData | null => {
    const cached = cacheRef.current.get(userId);
    if (!cached) return null;

    const isStale = Date.now() - cached.cachedAt > CACHE_TTL_MS;
    if (isStale) {
      cacheRef.current.delete(userId);
      return null;
    }

    return cached.data;
  }, []);

  /**
   * Store player data in cache
   */
  const setCache = useCallback((userId: string, data: PlayerPreviewData) => {
    cacheRef.current.set(userId, {
      data,
      cachedAt: Date.now(),
    });
  }, []);

  /**
   * Fetch player data with deduplication
   * If already fetching, reuse the same promise
   */
  const fetchPlayer = useCallback(async (
    userId: string,
    fetchFn: () => Promise<PlayerPreviewData | null>
  ): Promise<PlayerPreviewData | null> => {
    // Check cache first
    const cached = getCached(userId);
    if (cached) return cached;

    // Check for inflight request
    const inflight = inflightRef.current.get(userId);
    if (inflight && inflight.userId === userId) {
      return inflight.promise;
    }

    // Create new request
    const promise = fetchFn().then((data) => {
      if (data) {
        setCache(userId, data);
      }
      inflightRef.current.delete(userId);
      return data;
    }).catch((err) => {
      inflightRef.current.delete(userId);
      throw err;
    });

    inflightRef.current.set(userId, { promise, userId });
    return promise;
  }, [getCached, setCache]);

  /**
   * Prefetch multiple players (for when game row expands)
   */
  const prefetchPlayers = useCallback((
    userIds: string[],
    fetchFn: (userId: string) => Promise<PlayerPreviewData | null>
  ) => {
    // Only prefetch first 6 to avoid too many requests
    const toPrefetch = userIds.slice(0, 6).filter(id => !getCached(id));
    
    toPrefetch.forEach(userId => {
      fetchPlayer(userId, () => fetchFn(userId)).catch(() => {
        // Silently ignore prefetch errors
      });
    });
  }, [getCached, fetchPlayer]);

  /**
   * Check if a user is cached (for instant display decisions)
   */
  const isCached = useCallback((userId: string): boolean => {
    return getCached(userId) !== null;
  }, [getCached]);

  return {
    getCached,
    setCache,
    fetchPlayer,
    prefetchPlayers,
    isCached,
  };
}
