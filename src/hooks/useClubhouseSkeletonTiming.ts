/**
 * useClubhouseSkeletonTiming - Controls skeleton visibility with timing guards
 * 
 * INSTANT VIDEO: Optimized for faster fade-out when video is ready
 * 
 * - Minimum visibility: 150ms (reduced from 250ms - prevents flicker)
 * - Maximum visibility: 3000ms (reduced from 4000ms - faster fallback)
 * - Smooth fade out when first frame is ready
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { logBootEvent } from '@/utils/bootTimeline';
import { hlsBlobCache } from '@/utils/hlsBlobCache';

const MIN_SKELETON_MS = 150; // INSTANT VIDEO: Reduced for faster reveal
const MAX_SKELETON_MS = 3000; // INSTANT VIDEO: Reduced max wait

export type SkeletonMode = 'shimmer' | 'static' | 'hidden';

interface UseClubhouseSkeletonTimingResult {
  skeletonVisible: boolean;
  skeletonMode: SkeletonMode;
  signalFirstFrameReady: () => void;
}

export function useClubhouseSkeletonTiming(
  hasPosts: boolean
): UseClubhouseSkeletonTimingResult {
  const [skeletonVisible, setSkeletonVisible] = useState(true);
  const [skeletonMode, setSkeletonMode] = useState<SkeletonMode>('shimmer');
  const [firstFrameReady, setFirstFrameReady] = useState(false);
  
  const startTimeRef = useRef(Date.now());
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHiddenRef = useRef(false);
  const cacheCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Signal that first frame is ready (called from video/image load handlers)
  const signalFirstFrameReady = useCallback(() => {
    if (hasHiddenRef.current) return;
    
    logBootEvent('SKELETON_FIRST_FRAME_READY', {
      elapsed: Date.now() - startTimeRef.current,
    });
    
    setFirstFrameReady(true);
  }, []);

  // INSTANT VIDEO: Check blob cache periodically for pre-cached videos
  useEffect(() => {
    if (hasHiddenRef.current || firstFrameReady) return;
    
    // Check if first video is already in blob cache
    cacheCheckIntervalRef.current = setInterval(() => {
      const stats = hlsBlobCache.getOverallStats();
      if (stats.readyCount > 0 && !firstFrameReady) {
        logBootEvent('SKELETON_CACHE_HIT', {
          elapsed: Date.now() - startTimeRef.current,
          readyCount: stats.readyCount,
        });
        setFirstFrameReady(true);
      }
    }, 50); // Check every 50ms
    
    return () => {
      if (cacheCheckIntervalRef.current) {
        clearInterval(cacheCheckIntervalRef.current);
      }
    };
  }, [firstFrameReady]);

  // Maximum timeout - switch to static mode if first frame isn't ready
  useEffect(() => {
    maxTimerRef.current = setTimeout(() => {
      if (!hasHiddenRef.current && !firstFrameReady) {
        logBootEvent('SKELETON_MAX_TIMEOUT', {
          elapsed: MAX_SKELETON_MS,
        });
        setSkeletonMode('static');
        
        // Give static mode a moment, then hide
        setTimeout(() => {
          if (!hasHiddenRef.current) {
            hasHiddenRef.current = true;
            setSkeletonVisible(false);
            setSkeletonMode('hidden');
            logBootEvent('SKELETON_HIDDEN', { reason: 'max_timeout' });
          }
        }, 300); // INSTANT VIDEO: Reduced from 500ms
      }
    }, MAX_SKELETON_MS);

    return () => {
      if (maxTimerRef.current) {
        clearTimeout(maxTimerRef.current);
      }
    };
  }, [firstFrameReady]);

  // When first frame is ready, respect minimum duration then hide
  useEffect(() => {
    if (!firstFrameReady || hasHiddenRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, MIN_SKELETON_MS - elapsed);

    logBootEvent('SKELETON_READY_TO_HIDE', {
      elapsed,
      waitingFor: remaining,
    });

    minTimerRef.current = setTimeout(() => {
      if (!hasHiddenRef.current) {
        hasHiddenRef.current = true;
        setSkeletonVisible(false);
        setSkeletonMode('hidden');
        logBootEvent('SKELETON_HIDDEN', { 
          reason: 'first_frame_ready',
          totalDuration: Date.now() - startTimeRef.current,
        });
      }
    }, remaining);

    return () => {
      if (minTimerRef.current) {
        clearTimeout(minTimerRef.current);
      }
    };
  }, [firstFrameReady]);

  // If no posts arrive and we're still loading, keep skeleton visible
  // but this hook doesn't control that - the parent does via hasPosts

  return {
    skeletonVisible,
    skeletonMode,
    signalFirstFrameReady,
  };
}
