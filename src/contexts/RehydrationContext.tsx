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
        // Full rehydration: Invalidate all active queries
        await queryClient.invalidateQueries({
          refetchType: 'active',
        });
        console.log('[Rehydration] Full rehydration: All active queries invalidated');
      }

      // Wait a minimum display time for skeleton loaders (perceived performance)
      const MIN_SKELETON_DISPLAY_TIME = 400; // ms
      
      // Wait for queries to settle
      await queryClient.refetchQueries({
        type: 'active',
      });

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
