import { useState, useCallback, useRef, useEffect } from 'react';
import { preloadHlsManifest } from '@/utils/hlsPreload';
import { prefetchDebug } from '@/utils/prefetch-debug';

interface VideoReadyState {
  id: string;
  isReady: boolean;
  readyAt: number;
  error?: string;
}

interface UseVideoReadyQueueConfig {
  /** Number of videos to prefetch ahead of current position */
  prefetchAhead: number;
  /** Number of videos to keep cached behind current position */
  prefetchBehind: number;
  /** Timeout in ms before marking video as ready anyway (prevents infinite blocking) */
  readyTimeout: number;
  /** Callback when a video becomes ready */
  onVideoReady?: (id: string) => void;
}

interface UseVideoReadyQueueReturn {
  /** Set of video IDs that are ready to play */
  readySet: Set<string>;
  /** Check if a specific video is ready */
  isReady: (id: string) => boolean;
  /** Mark a video as ready (called by HLSPlayer onFirstFrame) */
  markReady: (id: string) => void;
  /** Mark a video as failed (still allows progression) */
  markFailed: (id: string, error?: string) => void;
  /** Get the highest ready index given an ordered list of IDs */
  getReadyBoundaryIndex: (orderedIds: string[]) => number;
  /** Check if user is approaching the ready boundary */
  isNearBoundary: (currentIndex: number, orderedIds: string[]) => boolean;
  /** Reset ready state (e.g., on refresh) */
  reset: () => void;
  /** Start prefetching for a range of videos */
  initiatePrefetch: (videoIds: string[], startIndex: number, videoUrlMap?: Map<string, string>) => void;
}

const DEFAULT_CONFIG: UseVideoReadyQueueConfig = {
  prefetchAhead: 8,  // Instagram-style: ±8 items (16 total)
  prefetchBehind: 8,
  readyTimeout: 10000, // 10 seconds
  onVideoReady: undefined,
};

export function useVideoReadyQueue(
  config: Partial<UseVideoReadyQueueConfig> = {}
): UseVideoReadyQueueReturn {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  const [readySet, setReadySet] = useState<Set<string>>(new Set());
  const readyStateMap = useRef<Map<string, VideoReadyState>>(new Map());
  const timeoutRefs = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const preloadingSet = useRef<Set<string>>(new Set()); // Track videos being preloaded
  const onVideoReadyRef = useRef(finalConfig.onVideoReady);
  
  // Keep callback ref updated
  useEffect(() => {
    onVideoReadyRef.current = finalConfig.onVideoReady;
  }, [finalConfig.onVideoReady]);
  
  // Mark a video as ready
  const markReady = useCallback((id: string, source: string = 'unknown') => {
    // Clear any pending timeout
    const existingTimeout = timeoutRefs.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutRefs.current.delete(id);
    }
    
    // Remove from preloading set
    preloadingSet.current.delete(id);
    
    readyStateMap.current.set(id, {
      id,
      isReady: true,
      readyAt: Date.now(),
    });
    
    setReadySet(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    
    // Debug logging
    prefetchDebug.readyQueueMarkedReady(id, source);
    
    onVideoReadyRef.current?.(id);
  }, []);
  
  // Mark a video as failed but still allow progression
  const markFailed = useCallback((id: string, error?: string) => {
    const existingTimeout = timeoutRefs.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutRefs.current.delete(id);
    }
    
    // Remove from preloading set
    preloadingSet.current.delete(id);
    
    readyStateMap.current.set(id, {
      id,
      isReady: true, // Mark as "ready" to not block scroll
      readyAt: Date.now(),
      error,
    });
    
    setReadySet(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    
    console.warn(`[VideoReadyQueue] Video ${id.substring(0, 8)} marked as failed:`, error);
  }, []);
  
  // Check if a video is ready
  const isReady = useCallback((id: string): boolean => {
    return readySet.has(id);
  }, [readySet]);
  
  // Get the boundary index (highest consecutive ready index from start)
  const getReadyBoundaryIndex = useCallback((orderedIds: string[]): number => {
    let boundaryIndex = -1;
    
    for (let i = 0; i < orderedIds.length; i++) {
      if (readySet.has(orderedIds[i])) {
        boundaryIndex = i;
      } else {
        // Stop at first non-ready video
        break;
      }
    }
    
    return boundaryIndex;
  }, [readySet]);
  
  // Check if user is approaching the ready boundary
  const isNearBoundary = useCallback((
    currentIndex: number, 
    orderedIds: string[]
  ): boolean => {
    const boundaryIndex = getReadyBoundaryIndex(orderedIds);
    // Near boundary if within 2 items of the edge
    return currentIndex >= boundaryIndex - 2;
  }, [getReadyBoundaryIndex]);
  
  // Ref-based state for initiatePrefetch to avoid dependency on readySet
  const readySetRef = useRef<Set<string>>(readySet);
  readySetRef.current = readySet;
  
  // Initiate prefetch for a range of videos - NOW ACTUALLY PRELOADS HLS
  // CRITICAL: This function must NOT have readySet in dependencies to prevent infinite loops
  const initiatePrefetch = useCallback((
    videoIds: string[], 
    startIndex: number,
    videoUrlMap?: Map<string, string> // Optional map of id -> HLS URL
  ) => {
    const { prefetchAhead, prefetchBehind, readyTimeout } = finalConfig;
    
    const prefetchStart = Math.max(0, startIndex - prefetchBehind);
    const prefetchEnd = Math.min(videoIds.length, startIndex + prefetchAhead + 1);
    
    // Use ref to check ready state without causing re-renders
    const currentReadySet = readySetRef.current;
    
    for (let i = prefetchStart; i < prefetchEnd; i++) {
      const id = videoIds[i];
      if (!id) continue;
      
      // Skip if already ready, already has a timeout pending, or already preloading
      if (currentReadySet.has(id) || timeoutRefs.current.has(id) || preloadingSet.current.has(id)) {
        continue;
      }
      
      // Mark as preloading
      preloadingSet.current.add(id);
      
      // Debug: Log initiate
      prefetchDebug.readyQueueInitiate(id, i);
      
      // If we have a URL map, trigger actual HLS preloading
      if (videoUrlMap?.has(id)) {
        const hlsUrl = videoUrlMap.get(id)!;
        
        preloadHlsManifest(hlsUrl, id)
          .then(() => {
            // Mark ready when prefetch completes
            if (!readySetRef.current.has(id)) {
              markReady(id, 'prefetch-complete');
            }
          })
          .catch(() => {
            // Silent fail - don't spam console
          });
      }
      
      // Set a timeout to mark as ready after readyTimeout (prevents infinite blocking)
      const timeout = setTimeout(() => {
        if (!readySetRef.current.has(id)) {
          markReady(id, 'timeout');
        }
        timeoutRefs.current.delete(id);
      }, readyTimeout);
      
      timeoutRefs.current.set(id, timeout);
    }
  }, [finalConfig, markReady]); // REMOVED readySet from deps!
  
  // Reset all state
  const reset = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
    readyStateMap.current.clear();
    preloadingSet.current.clear();
    setReadySet(new Set());
  }, []);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, []);
  
  return {
    readySet,
    isReady,
    markReady,
    markFailed,
    getReadyBoundaryIndex,
    isNearBoundary,
    reset,
    initiatePrefetch,
  };
}

export type { UseVideoReadyQueueConfig, UseVideoReadyQueueReturn, VideoReadyState };
