import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { dedupeRequest } from '@/utils/performance';

// Optimized query hook with automatic deduplication and performance enhancements
export const useOptimizedQuery = <T = unknown, E = unknown>(
  options: UseQueryOptions<T, E> & { dedupe?: boolean; ttl?: number }
) => {
  const { queryKey, queryFn, dedupe = true, ttl = 5000, ...restOptions } = options;

  const optimizedQueryFn = useCallback(async () => {
    if (!queryFn || typeof queryFn === 'symbol') throw new Error('Query function is required');
    
    if (dedupe) {
      const key = JSON.stringify(queryKey);
      return dedupeRequest(key, queryFn as () => Promise<T>, ttl);
    }
    
    return (queryFn as () => Promise<T>)();
  }, [queryFn, queryKey, dedupe, ttl]);

  return useQuery({
    ...restOptions,
    queryKey,
    queryFn: optimizedQueryFn,
    staleTime: restOptions.staleTime ?? 5 * 60 * 1000, // 5 minutes default
    gcTime: restOptions.gcTime ?? 10 * 60 * 1000, // 10 minutes default
    refetchOnWindowFocus: restOptions.refetchOnWindowFocus ?? false,
  });
};

// Optimized infinite query with performance enhancements
export const useOptimizedInfiniteQuery = <T = unknown, E = unknown>(
  options: UseInfiniteQueryOptions<T, E> & { dedupe?: boolean; ttl?: number }
) => {
  const { queryKey, queryFn, dedupe = true, ttl = 5000, ...restOptions } = options;

  const optimizedQueryFn = useCallback(async (context: any) => {
    if (!queryFn || typeof queryFn === 'symbol') throw new Error('Query function is required');
    
    if (dedupe) {
      const key = JSON.stringify([...queryKey, context.pageParam]);
      return dedupeRequest(key, () => (queryFn as any)(context) as Promise<T>, ttl);
    }
    
    return (queryFn as any)(context);
  }, [queryFn, queryKey, dedupe, ttl]);

  return useInfiniteQuery({
    ...restOptions,
    queryKey,
    queryFn: optimizedQueryFn,
    staleTime: restOptions.staleTime ?? 5 * 60 * 1000,
    gcTime: restOptions.gcTime ?? 10 * 60 * 1000,
    refetchOnWindowFocus: restOptions.refetchOnWindowFocus ?? false,
  });
};