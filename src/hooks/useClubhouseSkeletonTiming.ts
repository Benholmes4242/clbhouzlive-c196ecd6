/**
 * useClubhouseSkeletonTiming — first-content-ready contract.
 *
 * Skeleton clears when BOTH:
 *   1. posts have loaded (hasPosts === true)
 *   2. the first card's primary content is paint-ready
 *      (decoded image, video first frame, or rAF for text-only),
 *      surfaced via `signalFirstContentReady()`.
 *
 * Anti-flicker floor: MIN_SKELETON_MS (150ms).
 * Safety net:         MAX_SKELETON_MS (5000ms) → show content regardless.
 *
 * The decoded/first-frame signal means content is ALREADY on-screen at the
 * moment we get told, so we no longer add an additive buffer before lifting
 * the skeleton (the previous 200ms was a play()→poster-fade race guard
 * that's not needed under the new contract).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { logBootEvent } from '@/utils/bootTimeline';
import { videoDebug } from '@/config/videoDebug';

const MIN_SKELETON_MS = 150;
const MAX_SKELETON_MS = 5000;

export type SkeletonMode = 'shimmer' | 'static' | 'hidden';

interface UseClubhouseSkeletonTimingResult {
  skeletonVisible: boolean;
  skeletonMode: SkeletonMode;
  /** Fire once when the first card's primary content is paint-ready. */
  signalFirstContentReady: () => void;
  /** True when first content is confirmed paint-ready. */
  isFirstContentReady: boolean;
  /** Re-show skeleton (e.g. on tab switch to unloaded feed). */
  resetSkeleton: () => void;
  /** @deprecated kept for back-compat — alias of signalFirstContentReady */
  signalFirstFrameReady: () => void;
}

export function useClubhouseSkeletonTiming(
  hasPosts: boolean
): UseClubhouseSkeletonTimingResult {
  const [skeletonVisible, setSkeletonVisible] = useState(true);
  const [skeletonMode, setSkeletonMode] = useState<SkeletonMode>('shimmer');
  const [isFirstContentReady, setIsFirstContentReady] = useState(false);
  const [safetyTimeoutFired, setSafetyTimeoutFired] = useState(false);

  const startTimeRef = useRef(Date.now());
  const maxTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasHiddenRef = useRef(false);
  const firstContentReadyFiredRef = useRef(false);

  const signalFirstContentReady = useCallback(() => {
    if (firstContentReadyFiredRef.current || hasHiddenRef.current) return;
    firstContentReadyFiredRef.current = true;
    const elapsed = Date.now() - startTimeRef.current;
    logBootEvent('SKELETON_FIRST_CONTENT_READY', { elapsed });
    videoDebug('bootstrap', 'First content ready (decoded image / first frame)', { elapsed });
    // No additive buffer: signal source already paints visible pixels.
    setIsFirstContentReady(true);
  }, []);

  const resetSkeleton = useCallback(() => {
    hasHiddenRef.current = false;
    firstContentReadyFiredRef.current = false;
    startTimeRef.current = Date.now();
    setSkeletonVisible(true);
    setSkeletonMode('shimmer');
    setIsFirstContentReady(false);
    setSafetyTimeoutFired(false);

    if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    maxTimerRef.current = setTimeout(() => {
      if (!hasHiddenRef.current) {
        logBootEvent('SKELETON_SAFETY_TIMEOUT', { elapsed: MAX_SKELETON_MS });
        setSafetyTimeoutFired(true);
      }
    }, MAX_SKELETON_MS);
  }, []);

  useEffect(() => {
    maxTimerRef.current = setTimeout(() => {
      if (!hasHiddenRef.current) {
        logBootEvent('SKELETON_SAFETY_TIMEOUT', { elapsed: MAX_SKELETON_MS });
        videoDebug('bootstrap', 'Safety timeout - showing content anyway', { elapsed: MAX_SKELETON_MS });
        setSafetyTimeoutFired(true);
      }
    }, MAX_SKELETON_MS);
    return () => {
      if (maxTimerRef.current) clearTimeout(maxTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!hasPosts) return;
    if (!isFirstContentReady && !safetyTimeoutFired) return;
    if (hasHiddenRef.current) return;

    const elapsed = Date.now() - startTimeRef.current;
    const remaining = Math.max(0, MIN_SKELETON_MS - elapsed);

    logBootEvent('SKELETON_READY_TO_HIDE', {
      elapsed,
      waitingFor: remaining,
      reason: safetyTimeoutFired ? 'safety_timeout' : 'first_content_ready',
    });

    minTimerRef.current = setTimeout(() => {
      if (!hasHiddenRef.current) {
        hasHiddenRef.current = true;
        setSkeletonVisible(false);
        setSkeletonMode('hidden');
        const totalDuration = Date.now() - startTimeRef.current;
        logBootEvent('SKELETON_HIDDEN', {
          reason: safetyTimeoutFired ? 'safety_timeout' : 'first_content_ready',
          totalDuration,
        });
        videoDebug('bootstrap', 'Skeleton hidden', {
          reason: safetyTimeoutFired ? 'safety_timeout' : 'first_content_ready',
          totalDuration,
        });
      }
    }, remaining);

    return () => {
      if (minTimerRef.current) clearTimeout(minTimerRef.current);
    };
  }, [hasPosts, isFirstContentReady, safetyTimeoutFired]);

  return {
    skeletonVisible,
    skeletonMode,
    signalFirstContentReady,
    isFirstContentReady,
    resetSkeleton,
    signalFirstFrameReady: signalFirstContentReady,
  };
}
