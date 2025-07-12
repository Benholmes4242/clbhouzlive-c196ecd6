import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiry: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 100; // Maximum cache entries

  set<T>(key: string, data: T, ttl = 300000): void { // 5 minutes default
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global cache instance
const memoryCache = new MemoryCache();

// Enhanced API cache hook
export const useAPICache = <T = any>(cacheKey: string, ttl = 300000) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (queryFn: () => Promise<T>, forceRefresh = false) => {
    // Check memory cache first
    if (!forceRefresh) {
      const cachedData = memoryCache.get<T>(cacheKey);
      if (cachedData) {
        setData(cachedData);
        return cachedData;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await queryFn();
      memoryCache.set(cacheKey, result, ttl);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [cacheKey, ttl]);

  const invalidateCache = useCallback(() => {
    memoryCache.clear();
    setData(null);
  }, []);

  return {
    data,
    isLoading,
    error,
    fetchData,
    invalidateCache,
  };
};

// Simple connection-aware fetch hook
export const useConnectionAwareFetch = <T = any>(
  key: string,
  fetchFn: () => Promise<T>,
  options: { ttl?: number; enabled?: boolean } = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { ttl = 300000, enabled = true } = options;

  const fetchData = useCallback(async (forceRefresh = false) => {
    if (!enabled) return;

    // Check cache first
    if (!forceRefresh) {
      const cached = memoryCache.get<T>(key);
      if (cached) {
        setData(cached);
        return cached;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      memoryCache.set(key, result, ttl);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Fetch error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchFn, ttl, enabled]);

  // Auto-fetch on mount
  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled]);

  return {
    data,
    isLoading,
    error,
    refetch: () => fetchData(true),
  };
};