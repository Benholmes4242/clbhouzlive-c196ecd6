/**
 * useClubhouseSkeletonTiming - Controls skeleton visibility with timing guards
 * 
 * INSTANT VIDEO: Gates skeleton dismissal on BOTH:
 * 1. Posts data has loaded (hasPosts = true)
 * 2. First video is ready to play (canplaythrough fired OR MANIFEST_PARSED + buffer ready)
 * 
 * This ensures: Skeleton disappears → video plays within 50-100ms (imperceptible delay)
 * 
 * Timing:
 * - Minimum visibility: 150ms (prevents flicker)
 * - Maximum visibility: 5000ms (safety timeout - show content anyway)
 * - Smooth fade out when first video is genuinely playback-ready
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { logBootEvent } from '@/utils/bootTimeline';
import { hlsBlobCache } from '@/utils/hlsBlobCache';
import { videoDebug } from '@/config/videoDebug';

const MIN_SKELETON_MS = 150; // Minimum skeleton display to prevent flicker
const MAX_SKELETON_MS = 5000; // Safety timeout - show content after 5s regardless

export type SkeletonMode = 'shimmer' | 'static' | 'hidden';

interface UseClubhouseSkeletonTimingResult {
  skeletonVisible: boolean;
  skeletonMode: SkeletonMode;
  signalFirstFrameReady: () => void;
  /** True when first video is confirmed playback-ready */
  isFirstVideoReady: boolean;
}

export function useClubhouseSkeletonTiming(
  hasPosts: boolean
): UseClubhouseSkeletonTimingResult {
  const [skeletonVisible, setSkeletonVisible] = useState(true);
  const [skeletonMode, setSkeletonMode] = useState<SkeletonMode>('shimmer');
  const [isFirstVideoReady, setIsFirstVideoReady] = useState(false);
  const [safetyTimeoutFired, setSafetyTimeoutFired] = useState(false);
  
  const startTimeRef = useRef(Date.now());
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHiddenRef = useRef(false);
  const cacheCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const firstVideoReadyFiredRef = useRef(false);

  // Signal that first video is ready to play (called from video canplaythrough)
  // Adds a 100ms buffer to let play() → poster fadeout complete before skeleton fades
  const signalFirstFrameReady = useCallback(() => {
    if (firstVideoReadyFiredRef.current || hasHiddenRef.current) return;
    
    firstVideoReadyFiredRef.current = true;
    
    const elapsed = Date.now() - startTimeRef.current;
    logBootEvent('SKELETON_FIRST_VIDEO_READY', { elapsed });
    videoDebug('bootstrap', 'First video ready to play', { elapsed });
    
    // 100ms buffer: ensures play() resolves and poster begins fading
    // before the skeleton exit animation starts (200ms),
    // giving ~300ms total for the video to render visible frames.
    setTimeout(() => {
      setIsFirstVideoReady(true);
    }, 100);
  }, []);

  // INSTANT VIDEO: Check blob cache periodically for pre-cached videos
  // If segments are already cached, we can signal ready early
  useEffect(() => {
    if (hasHiddenRef.current || isFirstVideoReady || !hasPosts) return;
    
    cacheCheckIntervalRef.current = setInterval(() => {
      const stats = hlsBlobCache.getOverallStats();
      if (stats.readyCount > 0 && !firstVideoReadyFiredRef.current) {
        logBootEvent('SKELETON_CACHE_HIT', {
          elapsed: Date.now() - startTimeRef.current,
          readyCount: stats.readyCount,
        });
        videoDebug('bootstrap', 'Cache hit - first video segments ready', { readyCount: stats.readyCount });
        firstVideoReadyFiredRef.current = true;
        setIsFirstVideoReady(true);
      }
    }, 50);
    
    return () => {
      if (cacheCheckIntervalRef.current) {
        clearInterval(cacheCheckIntervalRef.current);
      }
    };
  }, [isFirstVideoReady, hasPosts]);

  // Safety timeout - show content after MAX_SKELETON_MS regardless of video state
  // This prevents indefinite skeleton if video loading fails
  useEffect(() => {
    maxTimerRef.current = setTimeout(() => {
      if (!hasHiddenRef.current) {
        logBootEvent('SKELETON_SAFETY_TIMEOUT', { elapsed: MAX_SKELETON_MS });
        videoDebug('bootstrap', 'Safety timeout - showing content anyway', { elapsed: MAX_SKELETON_MS });
        setSafetyTimeoutFired(true);
      }
    }, MAX_SKELETON_MS);

    return () => {
      if (maxTimerRef.current) {
        clearTimeout(maxTimerRef.current);
      }
    };
  }, []);

  // CORE LOGIC: Hide skeleton when BOTH conditions are met:
  // 1. Posts have loaded (hasPosts = true)
  // 2. First video is ready (isFirstVideoReady = true) OR safety timeout fired
  useEffect(() => {
    // Must have posts
    if (!hasPosts) return;
    
    // Must have video ready OR safety timeout
    if (!isFirstVideoReady && !safetyTimeoutFired) return;
    
    // Already hidden
    if (hasHiddenRef.current) return;
    
    // Respect minimum skeleton duration to prevent flicker
    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, MIN_SKELETON_MS - elapsed);

    logBootEvent('SKELETON_READY_TO_HIDE', {
      elapsed,
      waitingFor: remaining,
      reason: safetyTimeoutFired ? 'safety_timeout' : 'video_ready',
    });

    minTimerRef.current = setTimeout(() => {
      if (!hasHiddenRef.current) {
        hasHiddenRef.current = true;
        setSkeletonVisible(false);
        setSkeletonMode('hidden');
        
        const totalDuration = Date.now() - startTimeRef.current;
        logBootEvent('SKELETON_HIDDEN', { 
          reason: safetyTimeoutFired ? 'safety_timeout' : 'first_video_ready',
          totalDuration,
        });
        videoDebug('bootstrap', 'Skeleton hidden', { 
          reason: safetyTimeoutFired ? 'safety_timeout' : 'first_video_ready',
          totalDuration,
        });
      }
    }, remaining);

    return () => {
      if (minTimerRef.current) {
        clearTimeout(minTimerRef.current);
      }
    };
  }, [hasPosts, isFirstVideoReady, safetyTimeoutFired]);

  return {
    skeletonVisible,
    skeletonMode,
    signalFirstFrameReady,
    isFirstVideoReady,
  };
}
