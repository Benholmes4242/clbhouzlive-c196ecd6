import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppLifecycle, AppLifecycleState } from '../hooks/useAppLifecycle';

interface RehydrationContextValue extends AppLifecycleState {
  completeRehydration: () => void;
}

const RehydrationContext = createContext<RehydrationContextValue | null>(null);

export function useRehydration() {
  const context = useContext(RehydrationContext);
  if (!context) {
    throw new Error('useRehydration must be used within RehydrationProvider');
  }
  return context;
}

// Safe version that returns defaults when outside provider (for use during initial render)
export function useRehydrationSafe(): RehydrationContextValue {
  const context = useContext(RehydrationContext);
  if (!context) {
    return {
      isRehydrating: false,
      rehydrationLevel: 'none',
      lastBackgroundDuration: null,
      completeRehydration: () => {},
    };
  }
  return context;
}

interface RehydrationProviderProps {
  children: React.ReactNode;
}

// Query keys to invalidate on light rehydration
const FEED_QUERY_KEYS = [
  'posts',
  'infinite-clubhouse-shorts',
  'discover-videos',
  'notifications',
  'user-videos',
  'trending',
  'activity-feed',
  'explore-content',
  'user-profile',
];

export function RehydrationProvider({ children }: RehydrationProviderProps) {
  const queryClient = useQueryClient();
  const lifecycle = useAppLifecycle();
  const rehydrationInProgressRef = useRef(false);

  const handleRehydration = useCallback(async () => {
    if (!lifecycle.isRehydrating || rehydrationInProgressRef.current) return;

    rehydrationInProgressRef.current = true;
    const startTime = Date.now();
    
    console.log(`[Rehydration] Starting ${lifecycle.rehydrationLevel} rehydration`);

    try {
      if (lifecycle.rehydrationLevel === 'light') {
        // Light rehydration: Invalidate feed queries only
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return FEED_QUERY_KEYS.includes(key);
          },
        });
        console.log('[Rehydration] Light rehydration: Feed queries invalidated');
      } 
      else if (lifecycle.rehydrationLevel === 'full') {
        // Staggered full rehydration to avoid connection stampede
        // Priority 1: Critical live data (leaderboards, hero carousel)
        const PRIORITY_KEYS = [
          'hero-carousel-data', 'overview-live-right-now', 'live-arena',
          'tournament-top-leaders', 'live-leader-teaser',
        ];
        
        const p1Count = queryClient.getQueryCache().findAll({
          predicate: (query) => PRIORITY_KEYS.includes(query.queryKey[0] as string) && query.isActive(),
        }).length;
        console.log(`[Rehydration] Priority 1: ${p1Count} active queries to refetch`, 
          queryClient.getQueryCache().findAll({
            predicate: (query) => PRIORITY_KEYS.includes(query.queryKey[0] as string) && query.isActive(),
          }).map(q => q.queryKey));

        await queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return PRIORITY_KEYS.includes(key);
          },
        });
        console.log('[Rehydration] Priority 1: Live data invalidated');

        // Priority 2: Feed queries (after 500ms)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const p2Count = queryClient.getQueryCache().findAll({
          predicate: (query) => FEED_QUERY_KEYS.includes(query.queryKey[0] as string) && query.isActive(),
        }).length;
        console.log(`[Rehydration] Priority 2: ${p2Count} active queries to refetch`,
          queryClient.getQueryCache().findAll({
            predicate: (query) => FEED_QUERY_KEYS.includes(query.queryKey[0] as string) && query.isActive(),
          }).map(q => q.queryKey));

        await queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return FEED_QUERY_KEYS.includes(key);
          },
        });
        console.log('[Rehydration] Priority 2: Feed queries invalidated');

        // Priority 3: Everything else (after another 1000ms)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const p3Count = queryClient.getQueryCache().findAll({
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return !PRIORITY_KEYS.includes(key) && !FEED_QUERY_KEYS.includes(key) && query.isActive();
          },
        }).length;
        console.log(`[Rehydration] Priority 3: ${p3Count} active queries to refetch`);

        await queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey[0] as string;
            return !PRIORITY_KEYS.includes(key) && !FEED_QUERY_KEYS.includes(key);
          },
          refetchType: 'active',
        });
        
        const totalCount = p1Count + p2Count + p3Count;
        console.log(`[Rehydration] TOTAL: ${totalCount} queries refetched across 3 phases (P1:${p1Count} P2:${p2Count} P3:${p3Count})`);
      }

      // Wait a minimum display time for skeleton loaders (perceived performance)
      const MIN_SKELETON_DISPLAY_TIME = 400; // ms

      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_SKELETON_DISPLAY_TIME) {
        await new Promise(resolve => 
          setTimeout(resolve, MIN_SKELETON_DISPLAY_TIME - elapsed)
        );
      }

      console.log('[Rehydration] Complete - content refreshed in', Date.now() - startTime, 'ms');
    } catch (error) {
      console.error('[Rehydration] Error during rehydration:', error);
      // Continue anyway - better to show stale content than stay stuck
    } finally {
      rehydrationInProgressRef.current = false;
      lifecycle.completeRehydration();
    }
  }, [lifecycle, queryClient]);

  // Trigger rehydration when lifecycle state changes
  useEffect(() => {
    if (lifecycle.isRehydrating) {
      handleRehydration();
    }
  }, [lifecycle.isRehydrating, handleRehydration]);

  return (
    <RehydrationContext.Provider value={lifecycle}>
      {children}
    </RehydrationContext.Provider>
  );
}
