import { useState, useCallback, useRef, useEffect } from 'react';

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
  initiatePrefetch: (videoIds: string[], startIndex: number) => void;
}

const DEFAULT_CONFIG: UseVideoReadyQueueConfig = {
  prefetchAhead: 4,
  prefetchBehind: 4,
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
  const onVideoReadyRef = useRef(finalConfig.onVideoReady);
  
  // Keep callback ref updated
  useEffect(() => {
    onVideoReadyRef.current = finalConfig.onVideoReady;
  }, [finalConfig.onVideoReady]);
  
  // Mark a video as ready
  const markReady = useCallback((id: string) => {
    // Clear any pending timeout
    const existingTimeout = timeoutRefs.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutRefs.current.delete(id);
    }
    
    readyStateMap.current.set(id, {
      id,
      isReady: true,
      readyAt: Date.now(),
    });
    
    setReadySet(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      console.log(`[Prefetch] Video ready: ${id.substring(0, 8)}, total ready: ${next.size}`);
      return next;
    });
    
    onVideoReadyRef.current?.(id);
  }, []);
  
  // Mark a video as failed but still allow progression
  const markFailed = useCallback((id: string, error?: string) => {
    const existingTimeout = timeoutRefs.current.get(id);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutRefs.current.delete(id);
    }
    
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
  
  // Initiate prefetch for a range of videos
  const initiatePrefetch = useCallback((
    videoIds: string[], 
    startIndex: number
  ) => {
    const { prefetchAhead, prefetchBehind, readyTimeout } = finalConfig;
    
    const prefetchStart = Math.max(0, startIndex - prefetchBehind);
    const prefetchEnd = Math.min(videoIds.length, startIndex + prefetchAhead + 1);
    
    for (let i = prefetchStart; i < prefetchEnd; i++) {
      const id = videoIds[i];
      if (!id) continue;
      
      // Skip if already ready or already has a timeout pending
      if (readySet.has(id) || timeoutRefs.current.has(id)) {
        continue;
      }
      
      // Set a timeout to mark as ready after readyTimeout (prevents infinite blocking)
      const timeout = setTimeout(() => {
        if (!readySet.has(id)) {
          console.warn(`[VideoReadyQueue] Video ${id.substring(0, 8)} timed out, marking as ready anyway`);
          markReady(id);
        }
        timeoutRefs.current.delete(id);
      }, readyTimeout);
      
      timeoutRefs.current.set(id, timeout);
    }
  }, [finalConfig, readySet, markReady]);
  
  // Reset all state
  const reset = useCallback(() => {
    // Clear all timeouts
    timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    timeoutRefs.current.clear();
    readyStateMap.current.clear();
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
