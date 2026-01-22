/**
 * useInstantVideoReady - Track truly ready videos for instant playback
 * 
 * A video is "instant ready" when:
 * 1. HLS manifest is prefetched
 * 2. First 2 segments are in blob cache
 * 3. OR canplaythrough has fired
 * 
 * This enables the "skeleton until ready" pattern where we only reveal
 * videos that will play instantly with no loading spinner.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { hlsBlobCache } from '@/utils/hlsBlobCache';

interface VideoReadyEntry {
  videoId: string;
  isReady: boolean;
  readyAt?: number;
  source?: 'cache' | 'canplaythrough' | 'timeout';
}

interface UseInstantVideoReadyOptions {
  /** Maximum wait time before marking ready anyway */
  maxWaitMs?: number;
  /** Callback when a video becomes ready */
  onVideoReady?: (videoId: string) => void;
}

interface UseInstantVideoReadyReturn {
  /** Check if a specific video is instant-ready */
  isInstantReady: (videoId: string) => boolean;
  /** Mark a video as ready (call from canplaythrough) */
  markReady: (videoId: string, source?: 'cache' | 'canplaythrough' | 'timeout') => void;
  /** Check blob cache for a video */
  checkCacheReady: (videoId: string) => boolean;
  /** Get count of ready videos */
  readyCount: number;
  /** Get all ready video IDs */
  readyIds: string[];
}

export function useInstantVideoReady(
  options: UseInstantVideoReadyOptions = {}
): UseInstantVideoReadyReturn {
  const { maxWaitMs = 8000, onVideoReady } = options;
  
  const [readyMap, setReadyMap] = useState<Map<string, VideoReadyEntry>>(new Map());
  const timeoutRefs = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const onVideoReadyRef = useRef(onVideoReady);
  
  // Keep callback ref updated
  useEffect(() => {
    onVideoReadyRef.current = onVideoReady;
  }, [onVideoReady]);
  
  // Mark a video as ready
  const markReady = useCallback((videoId: string, source: 'cache' | 'canplaythrough' | 'timeout' = 'canplaythrough') => {
    // Clear any pending timeout
    const existingTimeout = timeoutRefs.current.get(videoId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      timeoutRefs.current.delete(videoId);
    }
    
    setReadyMap(prev => {
      if (prev.get(videoId)?.isReady) return prev;
      
      const next = new Map(prev);
      next.set(videoId, {
        videoId,
        isReady: true,
        readyAt: Date.now(),
        source,
      });
      return next;
    });
    
    onVideoReadyRef.current?.(videoId);
  }, []);
  
  // Check if video is in blob cache and ready
  const checkCacheReady = useCallback((videoId: string): boolean => {
    return hlsBlobCache.isReady(videoId);
  }, []);
  
  // Check if video is instant-ready
  const isInstantReady = useCallback((videoId: string): boolean => {
    // First check our ready map
    if (readyMap.get(videoId)?.isReady) return true;
    
    // Then check blob cache
    if (hlsBlobCache.isReady(videoId)) {
      // Mark it ready in our state too
      markReady(videoId, 'cache');
      return true;
    }
    
    return false;
  }, [readyMap, markReady]);
  
  // Derived values
  const readyCount = readyMap.size;
  const readyIds = Array.from(readyMap.keys()).filter(id => readyMap.get(id)?.isReady);
  
  // Cleanup
  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current.clear();
    };
  }, []);
  
  return {
    isInstantReady,
    markReady,
    checkCacheReady,
    readyCount,
    readyIds,
  };
}
