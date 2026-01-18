/**
 * HLSPlayer - Unified video player component (Paused-Video-First Architecture)
 * Single player for all HLS video across grids, cards, modals, and mini-player
 * 
 * Features:
 * - WebView-safe (inline attributes baked in)
 * - safePlay everywhere (no direct .play())
 * - PAUSED-VIDEO-FIRST: Video loads paused, displays first frame, then unpauses (no poster swap)
 * - Error handling with retry UI (no grey boxes)
 * - Native HLS on iOS, HLS.js fallback
 * 
 * ARCHITECTURE:
 * - Video element IS the preview (no separate poster image)
 * - Video loads with preload="auto", seeks to frame 0, pauses
 * - Loading placeholder shown until first video frame is painted
 * - On play: simply video.play() - no transition needed
 * - Eliminates zoom-jump and black flash issues from poster-to-video swaps
 */

import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle, memo, useMemo } from 'react';
import { Play, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { safePlay, isIOS } from '@/utils/safePlay';
import { loadHlsJs } from '@/utils/hlsLoader';
import type HlsType from 'hls.js';
import { cn } from '@/lib/utils';
import { VideoScrubber } from '@/components/video/VideoScrubber';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import { HlsLoadQueue } from '@/media/HlsLoadQueue';
import { 
  logFirstVideoMounted, 
  logFirstVideoCanplay, 
  logFirstVideoPlaying,
  logFirstVideoLoadedData,
} from '@/utils/bootTimeline';
import { getConnectionAwareQualityConfig } from '@/utils/connectionAwareQuality';
import { logVideoTelemetry } from '@/utils/videoTelemetry';
import {
  startVideoSession,
  recordTTFF,
  recordRebuffer,
  recordQualityChange,
  recordFailure,
  endVideoSession,
} from '@/lib/analytics/videoPerformance';

// ============ Debug Logging ============
import { DEBUG_HLS_PLAYER, FORCE_HLS_JS } from '@/media/debug';
import { VideoLoadingSpinner } from '@/media/components/VideoLoadingSpinner';
import { VideoErrorState } from '@/media/components/VideoErrorState';
import { prefetchDebug } from '@/utils/prefetch-debug';
import { createCachedHlsLoader } from '@/lib/cachedHlsLoader';
import { hlsBlobCache } from '@/utils/hlsBlobCache';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';

// Adaptive first frame timeout based on connection quality
// AUDIT FIX #1: Added 50% buffer to all timeouts for slow/congested connections
const getAdaptiveTimeout = (): number => {
  if (typeof navigator === 'undefined') return 22500; // Default 22.5s (15s + 50%)
  const connection = (navigator as any).connection;
  
  if (!connection) {
    return 22500; // Default 22.5s if no connection API (15s + 50%)
  }
  
  // Base timeouts with 50% buffer added for reliability
  switch (connection.effectiveType) {
    case 'slow-2g':
      return 45000; // 45 seconds (30s + 50%) for very slow
    case '2g':
      return 37500; // 37.5 seconds (25s + 50%)
    case '3g':
      return 30000; // 30 seconds (20s + 50%)
    case '4g':
    default:
      return 18000; // 18 seconds (12s + 50%) for fast connections
  }
};

const FIRST_FRAME_TIMEOUT_MS = getAdaptiveTimeout();

const getTimestamp = () => performance.now().toFixed(2);
const logDebug = (event: string, data?: any) => {
  if (DEBUG_HLS_PLAYER) {
    console.log(`[${getTimestamp()}ms] [HLSPlayer] ${event}`, data || '');
  }
};

// ============ Types ============

export interface HLSPlayerProps {
  // Source
  src: string;
  mp4FallbackUrl?: string; // Optional MP4 fallback URL to try when HLS fails
  
  // Playback
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  
  // Display
  className?: string;
  /** 
   * Aspect ratio for the video container. 
   * IMPORTANT: 'auto' is deprecated and will default to '9:16' for portrait or '16:9' for landscape.
   * Always pass an explicit aspect ratio to prevent layout shifts (zoom flash).
   */
  aspectRatio?: '3:4' | '16:9' | '1:1' | '9:16' | 'auto';
  objectFit?: 'cover' | 'contain';
  
  // Controls
  showMuteButton?: boolean;
  showPlayButton?: boolean;
  
  // Callbacks
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onClick?: () => void;
  onError?: (error: Error) => void;
  onLoadedData?: () => void;
  onCanPlayThrough?: () => void; // Called when video is buffered enough for smooth playback
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onFatalError?: (error: Error, triedMp4: boolean) => void; // Called when all fallbacks exhausted
  
  // Advanced
  externallyManaged?: boolean; // Disable internal play/pause on click
  startTime?: number; // Resume from position
  preload?: 'none' | 'metadata' | 'auto';
  managedByMediaRuntime?: boolean; // If true, MediaRuntime controls playback; if false/undefined, handle autoplay directly
  
  // Scrubber
  showScrubber?: boolean; // Show progress scrubber (default: true if MEDIA_SCRUBBER_V1)
  mediaId?: string; // Required for scrubber intent tracking
  
  /**
   * Custom loading component to show while first frame loads.
   * If not provided, uses default VideoLoadingSpinner.
   */
  customLoadingComponent?: React.ReactNode;
}

export interface HLSPlayerRef {
  play: () => Promise<boolean>;
  pause: () => void;
  seek: (time: number) => void;
  getElement: () => HTMLVideoElement | null;
  getCurrentTime: () => number;
  getDuration: () => number;
  attach: () => void;
  detach: () => void;
  isAttached: () => boolean;
}

// ============ Component ============

const HLSPlayer = forwardRef<HLSPlayerRef, HLSPlayerProps>(({
  src,
  mp4FallbackUrl,
  autoplay = false,
  muted = true,
  loop = false,
  className,
  aspectRatio = 'auto',
  objectFit = 'cover',
  showMuteButton = false,
  showPlayButton = false,
  onPlay,
  onPause,
  onEnded,
  onClick,
  onError,
  onLoadedData,
  onCanPlayThrough,
  onTimeUpdate,
  onFatalError,
  externallyManaged = false,
  startTime,
  preload = 'auto', // CHANGED: Use 'auto' for paused-video-first to load first frame
  managedByMediaRuntime = false,
  showScrubber,
  mediaId,
  customLoadingComponent,
}, ref) => {

  // ============ Paused-Video-First Architecture ============
  // Video loads paused at frame 0, displays that frame as preview
  // Loading placeholder shown until first video frame is painted
  // On play: simply video.play() - no poster/video swap needed
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const mountedRef = useRef(true);
  const firstFrameRequestedRef = useRef(false); // Guard against duplicate first-frame callbacks
  const timeUpdateListenerRef = useRef<((e: Event) => void) | null>(null); // Track timeupdate fallback listener
  const autoplayRef = useRef(autoplay); // Track autoplay prop without causing re-runs
  autoplayRef.current = autoplay;
  
  // TTFF timing ref
  const ttffStartRef = useRef<number>(0);
  const ttffFiredRef = useRef(false);

  // ==================================================================================
  // CRITICAL: Autoplay retry for initial-mount race condition
  // ==================================================================================
  // Problem: On Clubhouse initial landing, the autoplay effect can fire before HLS.js
  // has attached/loaded the source, causing safePlay() to fail silently.
  //
  // Solution: If autoplay=true but video is still paused after attemptPlay(), we
  // schedule a one-shot retry on loadedmetadata/canplay events.
  //
  // DO NOT REMOVE without testing first-video autoplay on fresh Clubhouse page load!
  // ==================================================================================
  const pendingAutoplayRetryRef = useRef(false);
  
  // Auto-retry ref for first-frame timeout (try once before showing error)
  const autoRetryAttemptedRef = useRef(false);
  
  // Track currently loaded source to prevent duplicate loads (infinite reload fix)
  const currentSrcRef = useRef<string | null>(null);
  
  // RUM: Rebuffer tracking ref
  const rebufferStartRef = useRef<number>(0);
  
  // ============ Debug: Log Component Mount ============
  const mountTimeRef = useRef<number>(performance.now());
  const spinnerShownTimeRef = useRef<number | null>(null);
  
  useEffect(() => {
    const shortSrc = src?.substring(src.lastIndexOf('/') + 1, src.lastIndexOf('/') + 9) || 'unknown';
    logDebug('MOUNT', { 
      src: shortSrc, 
      autoplay, 
      managedByMediaRuntime,
      mediaId: mediaId?.slice(0, 8)
    });
    
    // Prefetch debug logging
    // CRITICAL: For cache check, ALWAYS use stream UID extracted from URL, not mediaId
    // The prefetch system stores by stream UID, so lookup must also use stream UID
    const cacheKeyForDebug = uidFromNode({ src }) ?? mediaId ?? 'unknown';
    mountTimeRef.current = performance.now();
    prefetchDebug.playerMount(cacheKeyForDebug, src);
    prefetchDebug.verifyCacheStatus(cacheKeyForDebug, src);
    
    // Boot timeline: log first video mount
    if (mediaId) {
      logFirstVideoMounted(mediaId, src);
      
      // RUM: Start video session tracking
      const surface = managedByMediaRuntime ? 'feed' : 'standalone';
      startVideoSession(mediaId, surface, src);
    }
    
    return () => {
      logDebug('UNMOUNT', { src: shortSrc, mediaId: mediaId?.slice(0, 8) });
      prefetchDebug.playerUnmount(cacheKeyForDebug);
      
      // RUM: End video session
      if (mediaId) {
        endVideoSession(mediaId);
      }
      
      // Cleanup first-frame timeout
      if (firstFrameTimeoutRef.current) {
        clearTimeout(firstFrameTimeoutRef.current);
        firstFrameTimeoutRef.current = null;
      }
      if (firstFrameCleanupRef.current) {
        firstFrameCleanupRef.current();
        firstFrameCleanupRef.current = null;
      }
      // Cleanup HD badge timeout
      if (hdBadgeTimeoutRef.current) {
        clearTimeout(hdBadgeTimeoutRef.current);
        hdBadgeTimeoutRef.current = null;
      }
    };
  }, []);
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlaceholder, setShowPlaceholder] = useState(true); // Loading placeholder until first frame
  const [isMutedLocal, setIsMutedLocal] = useState(muted);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasFirstFrame, setHasFirstFrame] = useState(false); // Track first frame readiness
  const [firstFrameError, setFirstFrameError] = useState(false); // Track first frame timeout/error
  const [triedMp4Fallback, setTriedMp4Fallback] = useState(false); // Track if MP4 fallback was attempted
  const [showUnavailable, setShowUnavailable] = useState(false); // Show "Video unavailable" overlay
  const [lastError, setLastError] = useState<string | null>(null); // Last error message for debug
  
  // HD Badge: Show briefly when video upgrades to high quality
  const [showHDBadge, setShowHDBadge] = useState(false);
  const initialLevelRef = useRef<number>(-1);
  const hdBadgeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Ref for first-frame timeout cleanup
  const firstFrameTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstFrameCleanupRef = useRef<(() => void) | null>(null);
  
  // HLS.js error recovery tracking
  const hlsRecoveryAttemptsRef = useRef(0);
  const MAX_HLS_RECOVERY_ATTEMPTS = 3;

  // Buffering state for scrubber
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferedPct, setBufferedPct] = useState(0);
  
  // ============ Debug: Log State Changes (removed verbose logs) ============
  // POSTER_VISIBILITY_CHANGE and FIRST_FRAME_CHANGE logs removed for cleaner console
  // The important events VIDEO_SHOWN_SYNC and POSTER_HIDDEN_SYNC are still logged
  
  // ============ Imperative Handle ============
  
  // Track if source is attached
  const isAttachedRef = useRef(true);
  
  useImperativeHandle(ref, () => ({
    play: async () => {
      const video = videoRef.current;
      if (!video) return false;
      return await safePlay(video);
    },
    pause: () => {
      videoRef.current?.pause();
    },
    seek: (time: number) => {
      const video = videoRef.current;
      if (video) {
        video.currentTime = time;
      }
    },
    getElement: () => videoRef.current,
    getCurrentTime: () => videoRef.current?.currentTime ?? 0,
    getDuration: () => videoRef.current?.duration ?? 0,
    isAttached: () => isAttachedRef.current,
    attach: () => {
      // Re-attach HLS source if detached - must re-run setupSource
      if (!isAttachedRef.current && videoRef.current && src) {
      isAttachedRef.current = true;
        firstFrameRequestedRef.current = false; // Reset first frame guard
        ttffStartRef.current = 0; // Reset TTFF timer
        ttffFiredRef.current = false; // Allow new TTFF measurement
        currentSrcRef.current = null; // Reset source ref to force reload
        cleanupTimeUpdateListener(); // Cleanup any lingering listener
        setHasFirstFrame(false);
        setShowPlaceholder(true);
        setIsReady(false);
        // Force re-run setup by toggling a dependency
        // The useEffect watching src will handle setup
        // Trigger immediate setup
        setupSourceRef.current?.();
      }
    },
    detach: () => {
      // Detach and cleanup to save memory
      const video = videoRef.current;
      if (!video) return;
      
      isAttachedRef.current = false;
      firstFrameRequestedRef.current = false; // Reset first frame guard
      currentSrcRef.current = null; // Clear source ref for next attach
      cleanupTimeUpdateListener(); // Cleanup any lingering listener
      video.pause();
      
      // Fully release hls.js instance
      if (hlsRef.current) {
        try {
          hlsRef.current.stopLoad();
          hlsRef.current.detachMedia();
          hlsRef.current.destroy();
        } catch {}
        hlsRef.current = null;
      }
      
      // Clear src - show placeholder on next attach
      video.removeAttribute('src');
      video.load(); // Reset video element state
      setShowPlaceholder(true);
      setHasFirstFrame(false);
      setIsReady(false);
    },
  }), [src]);
  
  // ============ Sync External Muted State ============
  
  useEffect(() => {
    setIsMutedLocal(muted);
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);
  
  // ============ Sync External Autoplay State ============
  // React to autoplay prop changes to play/pause video without re-initializing HLS
  
  // Smart autoplay: MediaRuntime-managed vs Standalone
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isAttachedRef.current) return;

    // CRITICAL: Guard autoplay when no valid source
    // This prevents "safePlay 🚫 No valid src" warnings
    if (!src || src === '') {
      logDebug('SKIP_AUTOPLAY', { reason: 'no_valid_src', mediaId: mediaId?.slice(0, 8) });
      return;
    }

    // Update muted state
    video.muted = muted;

    const attemptPlay = () => {
      if (!video.isConnected) return;
      if (!autoplayRef.current) return;
      if (!video.paused) return;
      
      // Additional guard: ensure video has a source before attempting play
      if (!video.src && !video.currentSrc) {
        logDebug('SKIP_PLAY_NO_SRC', { mediaId: mediaId?.slice(0, 8) });
        return;
      }

      if (managedByMediaRuntime) {
        if (!mediaId) return;

        const isRegistered = MediaRuntime.getNode(mediaId) !== undefined;

        if (isRegistered) {
          MediaRuntime.requestPlay({
            id: mediaId,
            surface: 'clubhouse',
            reason: 'autoplay',
          });
        } else {
          // Node not yet registered (common on first mount). Play directly;
          // MediaRuntime can take over once registration completes.
          safePlay(video).catch(() => {});
        }
      } else {
        safePlay(video).catch(() => {});
      }
    };

    // Cleanup for any one-shot retry listeners we add
    let cleanupRetry: (() => void) | undefined;

    if (autoplay) {
      attemptPlay();

      // If we're still paused, schedule a one-shot retry once the element becomes ready.
      // This fixes the initial landing case where autoplay runs before src/HLS is fully attached.
      if (video.paused && !pendingAutoplayRetryRef.current) {
        pendingAutoplayRetryRef.current = true;

        const onReady = () => {
          pendingAutoplayRetryRef.current = false;
          attemptPlay();
        };

        video.addEventListener('loadedmetadata', onReady, { once: true });
        video.addEventListener('canplay', onReady, { once: true });

        cleanupRetry = () => {
          video.removeEventListener('loadedmetadata', onReady);
          video.removeEventListener('canplay', onReady);
          pendingAutoplayRetryRef.current = false;
        };
      }
    } else if (!video.paused) {
      // Don't pause if this video is playing due to user action
      if (managedByMediaRuntime && mediaId) {
        const activeReason = MediaRuntime.getActiveReason();
        const primaryActiveId = MediaRuntime.getPrimaryActiveId();
        
        // Only pause if NOT user-initiated OR this isn't the active video
        if (activeReason !== 'user' || primaryActiveId !== mediaId) {
          video.pause();
        }
      } else {
        video.pause();
      }
    }

    return () => {
      cleanupRetry?.();
    };
  }, [autoplay, muted, managedByMediaRuntime, mediaId, src]); // Added src to deps
  
  // ============ HLS Setup ============
  
  // Ref to hold setupSource function for attach() to call
  const setupSourceRef = useRef<(() => Promise<void>) | null>(null);
  
  // Setup generation token to prevent stale async work from attaching
  const setupGenRef = useRef(0);
  
  // Stable telemetry videoId - MUST use same UID extraction as prefetch cache
  // CRITICAL: For cache lookup, ALWAYS extract stream UID from URL, never use post ID
  const streamUid = uidFromNode({ src }) ?? 'unknown';
  // Keep mediaId for telemetry/logging if provided, but use streamUid for cache
  const telemetryVideoId = mediaId ?? streamUid;
  
  // Helper to cleanup timeupdate listener
  const cleanupTimeUpdateListener = useCallback(() => {
    const video = videoRef.current;
    if (video && timeUpdateListenerRef.current) {
      video.removeEventListener('timeupdate', timeUpdateListenerRef.current);
      timeUpdateListenerRef.current = null;
    }
  }, []);
  
  // ============ First Frame Detection (requestVideoFrameCallback) ============
  // MOVED HERE: Must be defined before the HLS setup useEffect that uses it
  
  // Use refs for values that shouldn't trigger re-creation of waitForFirstFrame
  const mediaIdRef = useRef(mediaId);
  mediaIdRef.current = mediaId;
  
  const waitForFirstFrame = useCallback((video: HTMLVideoElement) => {
    // Guard: only request once per src cycle
    if (firstFrameRequestedRef.current) return;
    firstFrameRequestedRef.current = true;
    
    // Clear any existing timeout
    if (firstFrameTimeoutRef.current) {
      clearTimeout(firstFrameTimeoutRef.current);
      firstFrameTimeoutRef.current = null;
    }
    
    const cleanup = () => {
      if (firstFrameTimeoutRef.current) {
        clearTimeout(firstFrameTimeoutRef.current);
        firstFrameTimeoutRef.current = null;
      }
      if (firstFrameCleanupRef.current) {
        firstFrameCleanupRef.current();
        firstFrameCleanupRef.current = null;
      }
      if (timeUpdateListenerRef.current) {
        video.removeEventListener('timeupdate', timeUpdateListenerRef.current);
        timeUpdateListenerRef.current = null;
      }
    };
    
    const markReady = () => {
      if (!mountedRef.current) return;
      cleanup();
      
      const currentMediaId = mediaIdRef.current;
      const effectiveVideoId = currentMediaId || telemetryVideoId;
      const timeToFirstFrame = Math.round(performance.now() - mountTimeRef.current);
      
      logDebug('FIRST_FRAME_DETECTED', {
        currentTime: video.currentTime,
        readyState: video.readyState,
        mediaId: currentMediaId?.slice(0, 8)
      });
      
      // Prefetch debug: Log first frame timing
      prefetchDebug.playerFirstFrameReady(effectiveVideoId, timeToFirstFrame);
      
      if (currentMediaId && ttffStartRef.current > 0 && !ttffFiredRef.current) {
        ttffFiredRef.current = true;
        const ttffMs = performance.now() - ttffStartRef.current;
        MediaRuntime.recordTtff(currentMediaId, ttffMs);
        recordTTFF(currentMediaId, false); // No poster in paused-video-first
      }
      
      logDebug('VIDEO_READY', { mediaId: currentMediaId?.slice(0, 8) });
      setHasFirstFrame(true);
      setFirstFrameError(false);
      
      // PAUSED-VIDEO-FIRST: Hide placeholder once video frame is painted
      // Use double rAF to ensure frame is actually painted before hiding
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (mountedRef.current) {
            // Prefetch debug: Log spinner hidden
            if (spinnerShownTimeRef.current) {
              const spinnerTime = Math.round(performance.now() - spinnerShownTimeRef.current);
              prefetchDebug.playerSpinnerHidden(effectiveVideoId, spinnerTime);
              spinnerShownTimeRef.current = null;
            }
            setShowPlaceholder(false);
          }
        });
      });
    };
    
    const markError = () => {
      if (!mountedRef.current) return;
      
      const currentMediaId = mediaIdRef.current;
      
      if (!autoRetryAttemptedRef.current) {
        autoRetryAttemptedRef.current = true;
        logDebug('FIRST_FRAME_AUTO_RETRY', { mediaId: currentMediaId?.slice(0, 8), timeoutMs: FIRST_FRAME_TIMEOUT_MS });
        
        if (hlsRef.current) {
          try {
            hlsRef.current.stopLoad();
            hlsRef.current.startLoad();
          } catch {}
        }
        
        firstFrameTimeoutRef.current = setTimeout(() => {
          if (!hasFirstFrame && mountedRef.current) {
            cleanup();
            logDebug('FIRST_FRAME_TIMEOUT_AFTER_RETRY', { mediaId: currentMediaId?.slice(0, 8) });
            setFirstFrameError(true);
            if (currentMediaId) recordFailure(currentMediaId, 'first_frame_timeout_after_retry', false);
          }
        }, FIRST_FRAME_TIMEOUT_MS);
        return;
      }
      
      cleanup();
      logDebug('FIRST_FRAME_TIMEOUT', { mediaId: currentMediaId?.slice(0, 8), timeoutMs: FIRST_FRAME_TIMEOUT_MS });
      setFirstFrameError(true);
      if (currentMediaId) recordFailure(currentMediaId, 'first_frame_timeout', false);
    };
    
    firstFrameTimeoutRef.current = setTimeout(() => markError(), FIRST_FRAME_TIMEOUT_MS);

    const anyVideo = video as any;
    if (typeof anyVideo.requestVideoFrameCallback === 'function') {
      const callbackId = anyVideo.requestVideoFrameCallback(() => markReady());
      if (typeof anyVideo.cancelVideoFrameCallback === 'function') {
        firstFrameCleanupRef.current = () => {
          try { anyVideo.cancelVideoFrameCallback(callbackId); } catch {}
        };
      }
      return;
    }

    const onTime = () => {
      if (video.currentTime > 0 && video.readyState >= 2) {
        video.removeEventListener('timeupdate', onTime);
        timeUpdateListenerRef.current = null;
        markReady();
      }
    };
    timeUpdateListenerRef.current = onTime;
    video.addEventListener('timeupdate', onTime, { passive: true });
  // CRITICAL: Empty dependency array! This callback must be stable.
  // All dynamic values are accessed via refs to prevent the HLS setup 
  // useEffect from re-running when hasFirstFrame changes.
  }, []);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    
    // Skip if detached
    if (!isAttachedRef.current) return;
    
    // CRITICAL: Source stability guard - prevent reload if same source already loaded
    // This is the main fix for the infinite reload loop
    if (src === currentSrcRef.current && hlsRef.current) {
      logDebug('SKIP_RELOAD', { reason: 'same_source_already_loaded', src: src.slice(-20), mediaId: mediaId?.slice(0, 8) });
      return;
    }
    
    // Mark this source as the current one being loaded
    currentSrcRef.current = src;
    
    // Reset all state for new src
    mountedRef.current = true;
    firstFrameRequestedRef.current = false;
    hlsRecoveryAttemptsRef.current = 0; // Reset recovery counter for new source
    autoRetryAttemptedRef.current = false; // Reset auto-retry for new source
    ttffStartRef.current = performance.now(); // Start TTFF timer
    ttffFiredRef.current = false; // Reset TTFF fired flag
    mountTimeRef.current = performance.now(); // Reset mount time for first frame timing
    cleanupTimeUpdateListener();
    setHasError(false);
    setIsReady(false);
    setHasFirstFrame(false);
    setShowPlaceholder(true);
    setTriedMp4Fallback(false); // Reset MP4 fallback state for new source
    
    // Prefetch debug: Log spinner shown on src change
    const effectiveVideoId = mediaId || telemetryVideoId;
    spinnerShownTimeRef.current = performance.now();
    prefetchDebug.playerSpinnerShown(effectiveVideoId, 'src changed');
    prefetchDebug.playerStateReset(effectiveVideoId, 'src changed');
    
    // Generate a stable queue media ID for this video
    const queueMediaId = mediaId || `hls-${src.slice(-24)}`;
    
    // Cancel any pending queue request for this media before starting new setup
    HlsLoadQueue.cancel(queueMediaId);
    
    const setupSource = async () => {
      // Increment generation token - any stale async work will bail
      const myGen = ++setupGenRef.current;
      
      const shortSrc = src?.substring(src.lastIndexOf('/') + 1, src.lastIndexOf('/') + 9) || 'unknown';
      logDebug('HLS_LOAD_START', { src: shortSrc, mediaId: mediaId?.slice(0, 8), generation: myGen });
      
      // Cleanup previous HLS instance
      if (hlsRef.current) {
        try {
          // Clear listeners first to prevent late events firing into stale closures
          hlsRef.current.removeAllListeners?.();
          hlsRef.current.stopLoad();
          hlsRef.current.detachMedia();
          hlsRef.current.destroy();
        } catch {}
        hlsRef.current = null;
      }
      
      // Hard reset video element for stubborn pipelines (Safari/iOS + HLS fatal recovery)
      try {
        video.pause();
        video.currentTime = 0;
      } catch {}
      
      // Clear any <source> children
      try {
        while (video.firstChild) video.removeChild(video.firstChild);
      } catch {}
      
      // Clear format markers so next setup isn't "born failed"
      video.removeAttribute('data-format-error');
      video.removeAttribute('data-autoplay-blocked');
      
      // Reset video src
      video.removeAttribute('src');
      try {
        video.load();
      } catch {}
      
      // Bail if stale after cleanup
      if (myGen !== setupGenRef.current) {
        logDebug('SETUP_STALE_AFTER_CLEANUP', { myGen, currentGen: setupGenRef.current });
        return;
      }
      
      // Check if native HLS supported (iOS/Safari)
      // Can be overridden with FORCE_HLS_JS for debugging
      const canPlayNatively = !FORCE_HLS_JS && (
        isIOS ||
        video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
        video.canPlayType('application/vnd.apple.mpegURL') !== '' ||
        video.canPlayType('application/x-mpegURL') !== ''
      );
      
      const useHlsJs = !canPlayNatively && src.includes('.m3u8');
      
      // Priority for queue: higher = more important
      // Videos that are already visible or have autoplay get higher priority
      const queuePriority = autoplay ? 100 : 50;
      
      try {
        // ============ QUEUE INTEGRATION ============
        // Request a slot in the load queue before starting actual loading
        // This prevents network congestion from too many simultaneous loads
        await HlsLoadQueue.request(
          queueMediaId,
          queuePriority,
          // Load function - called when queue slot is available
          async () => {
            // Bail if component unmounted or generation changed while waiting in queue
            if (!mountedRef.current || myGen !== setupGenRef.current) {
              logDebug('QUEUE_LOAD_STALE', { queueMediaId: queueMediaId.slice(0, 8), mounted: mountedRef.current, myGen, currentGen: setupGenRef.current });
              HlsLoadQueue.complete(queueMediaId);
              return;
            }
            
            if (!useHlsJs) {
              // ============ Native HLS Playback ============
              video.src = src;
              
              // Native HLS error handler for consistent retry/overlay behavior
              const onNativeError = () => {
                // Skip if stale setup
                if (myGen !== setupGenRef.current) return;
                
                // Complete queue request on error
                HlsLoadQueue.complete(queueMediaId);
                
                logVideoTelemetry('hls_fatal_error', {
                  videoId: telemetryVideoId,
                  hlsType: 'native',
                  hlsDetails: video.error?.message ?? 'native_playback_error',
                  fatal: true
                });
                
                // Attempt MP4 fallback if available
                if (mp4FallbackUrl && !triedMp4Fallback) {
                  logVideoTelemetry('mp4_fallback_attempted', {
                    videoId: telemetryVideoId,
                    mp4FallbackUrl: mp4FallbackUrl?.slice(-60)
                  });
                  
                  setTriedMp4Fallback(true);
                  video.src = mp4FallbackUrl;
                  video.load();
                  
                  safePlay(video).then(played => {
                    if (played) {
                      setHasError(false);
                      setShowUnavailable(false);
                      setLastError(null);
                      logVideoTelemetry('mp4_fallback_succeeded', { videoId: telemetryVideoId });
                    } else {
                      setHasError(true);
                      setShowUnavailable(true);
                      setLastError('MP4 fallback failed');
                      logVideoTelemetry('mp4_fallback_failed', { videoId: telemetryVideoId, reason: 'safePlay_failed' });
                      logVideoTelemetry('video_unavailable_shown', { videoId: telemetryVideoId });
                      onFatalError?.(new Error('MP4 fallback failed'), true);
                    }
                  }).catch(() => {
                    setHasError(true);
                    setShowUnavailable(true);
                    setLastError('MP4 fallback exception');
                    logVideoTelemetry('video_unavailable_shown', { videoId: telemetryVideoId });
                    onFatalError?.(new Error('MP4 fallback exception'), true);
                  });
                  return;
                }
                
                setHasError(true);
                setShowUnavailable(true);
                setLastError(video.error?.message ?? 'native_error');
                logVideoTelemetry('video_unavailable_shown', { videoId: telemetryVideoId });
                onFatalError?.(new Error(video.error?.message ?? 'Native playback error'), triedMp4Fallback);
              };
              video.addEventListener('error', onNativeError, { once: true });
              
              // Complete queue when native HLS has loaded metadata
              const onNativeLoaded = () => {
                HlsLoadQueue.complete(queueMediaId);
                video.removeEventListener('loadedmetadata', onNativeLoaded);
              };
              video.addEventListener('loadedmetadata', onNativeLoaded, { once: true });
              
              // Apply start time
              if (startTime && startTime > 0) {
                video.currentTime = startTime;
              }
              
              // Apply iOS nudge
              if (isIOS && video.currentTime === 0) {
                try {
                  video.currentTime = 0.001;
                } catch {}
              }
            } else {
              // ============ HLS.js Playback ============
              const Hls = await loadHlsJs();
              
              if (!Hls || !Hls.isSupported() || !mountedRef.current) {
                setHasError(true);
                HlsLoadQueue.complete(queueMediaId);
                return;
              }
              
              // Get connection-aware quality settings
              const qualityConfig = getConnectionAwareQualityConfig();
              
              // OPTIMIZATION: Force lowest quality for instant start, then upgrade
              // This significantly reduces TTFF (Time To First Frame)
              
              // CRITICAL: Extract stream UID from the HLS URL for cache lookup
              // The prefetch system stores segments by stream UID, not post ID
              // Use uidFromNode for consistent extraction across the codebase
              const cacheVideoId = uidFromNode({ src }) ?? 'unknown';
              
              // CRITICAL FIX: Wait for prefetch to complete if it's in progress
              // This prevents the race condition where HLSPlayer mounts and starts
              // loading from network while prefetch is still fetching segments
              if (!hlsBlobCache.isReady(cacheVideoId) && hlsBlobCache.hasEntry(cacheVideoId)) {
                // Prefetch is in progress - wait for it (with 2s timeout)
                console.log(`[HLSPlayer] ⏳ Waiting for prefetch to complete for ${cacheVideoId.slice(0, 8)}...`);
                const prefetchReady = await hlsBlobCache.waitForReady(cacheVideoId, 2000);
                
                // Bail if stale after waiting
                if (!mountedRef.current || myGen !== setupGenRef.current) {
                  console.log(`[HLSPlayer] Setup stale after waiting for prefetch`);
                  HlsLoadQueue.complete(queueMediaId);
                  return;
                }
                
                if (prefetchReady) {
                  console.log(`[HLSPlayer] ✅ Prefetch completed, proceeding with cached segments`);
                } else {
                  console.log(`[HLSPlayer] ⚠️ Prefetch timed out, proceeding with network load`);
                }
              }
              
              // Check if this video is prefetched
              const isPrefetched = hlsBlobCache.isReady(cacheVideoId);
              if (isPrefetched) {
                console.log(`[HLSPlayer] ✅ Video ${cacheVideoId.slice(0, 8)} is PREFETCHED - will use cached segments`);
              } else {
                console.log(`[HLSPlayer] Video ${cacheVideoId.slice(0, 8)} not prefetched (mediaId: ${mediaId?.slice(0, 8) || 'none'})`);
              }
              
              const hls = new Hls({
                // Use the cached loader to serve prefetched segments
                loader: createCachedHlsLoader(cacheVideoId),
                
                // Always start at lowest quality for fastest first frame
                // ABR will upgrade to better quality after playback starts
                startLevel: 0, // Force lowest quality (was: qualityConfig.startLevel)
                
                // Reduce buffer requirements for faster start
                maxBufferLength: 8, // Reduced from 10
                maxMaxBufferLength: 15, // Reduced from 20
                backBufferLength: 3, // Reduced from 4
                
                // Lower initial buffer target for faster playback start
                maxBufferSize: 10 * 1000 * 1000, // 10MB max buffer
                maxBufferHole: 0.5, // Tolerate 0.5s gaps
                
                // Faster ABR response for quality upgrades
                abrEwmaFastLive: 3,
                abrEwmaSlowLive: 9,
                abrEwmaDefaultEstimate: qualityConfig.abrEwmaDefaultEstimate,
                abrBandWidthFactor: 0.95,
                abrBandWidthUpFactor: 0.7, // Faster ramp-up to HD
                
                // Faster error recovery
                fragLoadingTimeOut: 8000, // Reduced from 10000
                manifestLoadingTimeOut: 8000, // Reduced from 10000
                
                // Low latency optimizations
                lowLatencyMode: false, // Not live streaming
                enableWorker: true, // Use web worker for parsing
              });
              
              // Apply quality cap after creation (autoLevelCapping is a property, not config)
              if (qualityConfig.autoLevelCapping >= 0) {
                hls.autoLevelCapping = qualityConfig.autoLevelCapping;
              }
              
              hls.on(Hls.Events.ERROR, async (_, data) => {
                // Skip non-fatal errors - HLS.js handles these automatically
                if (!data.fatal) return;

                const videoEl = videoRef.current;
                
                // Log telemetry for fatal HLS error
                logVideoTelemetry('hls_fatal_error', {
                  videoId: telemetryVideoId,
                  hlsType: data.type,
                  hlsDetails: data.details,
                  fatal: true,
                  recoveryAttempt: hlsRecoveryAttemptsRef.current
                });

                // ============ HLS.js Error Recovery ============
                // Attempt built-in recovery before giving up
                if (hlsRecoveryAttemptsRef.current < MAX_HLS_RECOVERY_ATTEMPTS) {
                  hlsRecoveryAttemptsRef.current++;
                  
                  logDebug('HLS_RECOVERY_ATTEMPT', {
                    attempt: hlsRecoveryAttemptsRef.current,
                    maxAttempts: MAX_HLS_RECOVERY_ATTEMPTS,
                    errorType: data.type,
                    errorDetails: data.details
                  });

                  // Use appropriate recovery method based on error type
                  switch (data.type) {
                    case 'mediaError':
                      // MEDIA_ERROR: Try to recover by reconfiguring the media element
                      logDebug('HLS_RECOVER_MEDIA_ERROR');
                      try {
                        hls.recoverMediaError();
                        return; // Recovery initiated, don't proceed to error state
                      } catch (e) {
                        logDebug('HLS_RECOVER_MEDIA_ERROR_FAILED', e);
                      }
                      break;
                      
                    case 'networkError':
                      // NETWORK_ERROR: Try to restart loading
                      logDebug('HLS_RECOVER_NETWORK_ERROR');
                      try {
                        hls.startLoad();
                        return; // Recovery initiated, don't proceed to error state
                      } catch (e) {
                        logDebug('HLS_RECOVER_NETWORK_ERROR_FAILED', e);
                      }
                      break;
                      
                    default:
                      // For other errors, try swapping audio codec (last resort)
                      if (hlsRecoveryAttemptsRef.current === MAX_HLS_RECOVERY_ATTEMPTS) {
                        logDebug('HLS_SWAP_AUDIO_CODEC');
                        try {
                          hls.swapAudioCodec();
                          hls.recoverMediaError();
                          return;
                        } catch (e) {
                          logDebug('HLS_SWAP_AUDIO_CODEC_FAILED', e);
                        }
                      }
                  }
                }

                // ============ Recovery Exhausted - Fatal Error Path ============
                logDebug('HLS_RECOVERY_EXHAUSTED', {
                  attempts: hlsRecoveryAttemptsRef.current,
                  errorType: data.type,
                  errorDetails: data.details
                });
                
                // Complete queue request on fatal error
                HlsLoadQueue.complete(queueMediaId);
                
                // RUM: Record HLS failure
                if (mediaId) {
                  recordFailure(mediaId, `hls_${data.type}_${data.details}`, true);
                }

                // Safety guard
                if (!videoEl) {
                  onError?.(new Error(data.details));
                  return;
                }

                // Try MP4 fallback if available
                if (mp4FallbackUrl && !triedMp4Fallback) {
                  logVideoTelemetry('mp4_fallback_attempted', {
                    videoId: telemetryVideoId,
                    mp4FallbackUrl: mp4FallbackUrl?.slice(-60)
                  });

                  setTriedMp4Fallback(true);

                  try {
                    // Destroy HLS instance cleanly
                    try {
                      hls.removeAllListeners?.();
                      hls.destroy();
                    } catch {}
                    hlsRef.current = null;

                    // Reset element state
                    videoEl.pause();
                    videoEl.removeAttribute('src');
                    videoEl.load();

                    // Assign MP4 source
                    videoEl.src = mp4FallbackUrl;
                    videoEl.load();

                    // Attempt playback
                    const played = await safePlay(videoEl);

                    if (played) {
                      setHasError(false);
                      setShowUnavailable(false);
                      setLastError(null);
                      logVideoTelemetry('mp4_fallback_succeeded', { videoId: telemetryVideoId });
                      return;
                    }

                    // MP4 failed
                    logVideoTelemetry('mp4_fallback_failed', {
                      videoId: telemetryVideoId,
                      reason: 'safePlay_returned_false'
                    });
                    onFatalError?.(new Error('MP4 fallback failed'), true);
                    setHasError(true);
                    setShowUnavailable(true);
                    setLastError('MP4 fallback failed');
                    logVideoTelemetry('video_unavailable_shown', { videoId: telemetryVideoId });
                    return;

                  } catch (err) {
                    logVideoTelemetry('mp4_fallback_failed', {
                      videoId: telemetryVideoId,
                      reason: err instanceof Error ? err.message : 'unknown_exception'
                    });
                    onFatalError?.(err instanceof Error ? err : new Error('MP4 fallback error'), true);
                    setHasError(true);
                    setShowUnavailable(true);
                    setLastError(err instanceof Error ? err.message : 'MP4 fallback error');
                    logVideoTelemetry('video_unavailable_shown', { videoId: telemetryVideoId });
                    return;
                  }
                }

                // No fallback possible or already tried
                setHasError(true);
                setShowUnavailable(true);
                setLastError(data.details ?? 'unknown_error');
                logVideoTelemetry('video_unavailable_shown', { videoId: telemetryVideoId });
                onFatalError?.(new Error(data.details), triedMp4Fallback);
              });
              
              hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (!mountedRef.current) return;
                
                // Complete queue request when manifest is parsed (loading succeeded)
                HlsLoadQueue.complete(queueMediaId);
                
                const parseTime = performance.now();
                
                // Log available quality levels
                const levels = hls.levels?.map((l, i) => ({
                  index: i,
                  width: l.width,
                  height: l.height,
                  bitrateKbps: Math.round((l.bitrate || 0) / 1000),
                }));
                
                // MANIFEST_PARSED log removed for cleaner console
                logDebug('MANIFEST_PARSED', { mediaId: mediaId?.slice(0, 8), levels });
                
                // CRITICAL: Immediately start loading video segments to reduce TTFF
                hls.startLoad(-1);
                
                // Apply start time after manifest loaded
                if (startTime && startTime > 0) {
                  video.currentTime = startTime;
                }
                
                // iOS nudge
                if (isIOS && video.currentTime === 0) {
                  try {
                    video.currentTime = 0.001;
                  } catch {}
                }
              });
              
              // Log quality level switches and show HD badge on upgrade
              hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
                const level = hls.levels?.[data.level];
                const levelHeight = level?.height ?? 0;
                
                // Track initial level (first switch after start)
                if (initialLevelRef.current === -1) {
                  initialLevelRef.current = data.level;
                } else if (data.level > initialLevelRef.current && levelHeight >= 720) {
                  // Upgraded to HD (720p+) - show badge briefly
                  setShowHDBadge(true);
                  if (hdBadgeTimeoutRef.current) {
                    clearTimeout(hdBadgeTimeoutRef.current);
                  }
                  hdBadgeTimeoutRef.current = setTimeout(() => {
                    setShowHDBadge(false);
                  }, 2000);
                }
                
                // RUM: Record quality change
                if (mediaId && level?.bitrate) {
                  recordQualityChange(
                    mediaId, 
                    level.bitrate,
                    level.width && level.height ? { width: level.width, height: level.height } : undefined
                  );
                }
              });
              
              
              // Bail if stale after async HLS.js load
              if (myGen !== setupGenRef.current) {
                logDebug('SETUP_STALE_AFTER_HLS_LOAD', { myGen, currentGen: setupGenRef.current });
                try { hls.destroy(); } catch {}
                HlsLoadQueue.complete(queueMediaId);
                return;
              }
              
              // Set ref BEFORE attach/load so cleanup kills the right instance
              hlsRef.current = hls;
              hls.attachMedia(video);
              hls.loadSource(src);
            }
          },
          // onStart callback - called when this video is DEQUEUED and about to load
          // CRITICAL: Start timeout timer HERE, not when queued!
          () => {
            logDebug('QUEUE_DEQUEUED', { queueMediaId: queueMediaId.slice(0, 8) });
            
            // Start first-frame timeout timer NOW that we're actually loading
            if (videoRef.current) {
              waitForFirstFrame(videoRef.current);
            }
          }
        );
      } catch (err) {
        // Queue request was cancelled (component unmounted, source changed, etc.)
        logDebug('QUEUE_CANCELLED', { queueMediaId: queueMediaId.slice(0, 8), error: err instanceof Error ? err.message : 'unknown' });
      }
    };
    
    // Store setupSource for attach() to call
    setupSourceRef.current = setupSource;
    
    setupSource();
    
    return () => {
      mountedRef.current = false;
      setupSourceRef.current = null;
      // Clear current source ref on cleanup so re-mount will reload
      currentSrcRef.current = null;
      
      // Cancel any pending queue request on unmount
      HlsLoadQueue.cancel(queueMediaId);
      
      if (hlsRef.current) {
        try {
          // Clear listeners first to prevent late events
          hlsRef.current.removeAllListeners?.();
          hlsRef.current.stopLoad();
          hlsRef.current.detachMedia();
          hlsRef.current.destroy();
        } catch {}
        hlsRef.current = null;
      }
    };
  // CRITICAL: Minimal dependency array to prevent infinite reload loops
  // - src: Only reload when the actual video URL changes
  // - startTime: Resume from different position
  // - mediaId: For tracking/telemetry updates (stable per video)
  // REMOVED: waitForFirstFrame (now stable), autoplay (handled separately), 
  //          onError (callback stability issues), cleanupTimeUpdateListener (internal ref)
  }, [src, startTime, mediaId]);
  
  // ============ Event Handlers ============
  
  // Apply WebView attributes and expose ref for prewarm
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('x5-playsinline', 'true');

      // Expose player ref on element for prewarm observer to call attach/detach
      // IMPORTANT: keep this logic in sync with the imperative handle attach/detach.
      // If we detach/attach without resetting first-frame detection, the video can
      // "play" (time updates) while still showing the poster (appears frozen).
      (video as any).__hlsPlayerRef = {
        isAttached: () => isAttachedRef.current,
        attach: () => {
          const debugId = (window as any).__DEBUG_MEDIA_AUTOPLAY_ID as string | undefined;
          const id = video.dataset.mediaAutoplayId;
          if (debugId && id === debugId) {
            console.log('[AutoplayDebug][HLSPlayerRef] attach called', {
              id: id.slice(0, 8),
              isAttached: isAttachedRef.current,
              src,
              hasSrcAttr: video.hasAttribute('src'),
              currentSrc: video.currentSrc,
              readyState: video.readyState,
            });
          }

          // Skip if already attached - prevents white flash from unnecessary resets
          if (!isAttachedRef.current) {
            isAttachedRef.current = true;

            // Critical: reset first-frame detection so video can show first frame again
            firstFrameRequestedRef.current = false;
            currentSrcRef.current = null; // Reset source ref to force reload
            cleanupTimeUpdateListener();

            setHasFirstFrame(false);
            setShowPlaceholder(true);
            setIsReady(false);

            setupSourceRef.current?.();
          }
        },
        detach: () => {
          const debugId = (window as any).__DEBUG_MEDIA_AUTOPLAY_ID as string | undefined;
          const id = video.dataset.mediaAutoplayId;
          if (debugId && id === debugId) {
            console.log('[AutoplayDebug][HLSPlayerRef] detach called', {
              id: id.slice(0, 8),
              isAttached: isAttachedRef.current,
              src,
              currentSrc: video.currentSrc,
              readyState: video.readyState,
              currentTime: video.currentTime,
            });
          }

          if (isAttachedRef.current) {
            isAttachedRef.current = false;

            // Critical: reset first-frame detection for next attach
            firstFrameRequestedRef.current = false;
            currentSrcRef.current = null; // Clear source ref for next attach
            cleanupTimeUpdateListener();

            video.pause();
            if (hlsRef.current) {
              try {
                hlsRef.current.stopLoad();
                hlsRef.current.detachMedia();
                hlsRef.current.destroy();
              } catch {}
              hlsRef.current = null;
            }
            video.removeAttribute('src');
            video.load();
            setShowPlaceholder(true);
            setHasFirstFrame(false);
            setIsReady(false);
          }
        }
      };

      // Cleanup __hlsPlayerRef on unmount to prevent stale refs
      return () => {
        delete (video as any).__hlsPlayerRef;
      };
    }
  }, [cleanupTimeUpdateListener, src]);
  
  const handleLoadedData = useCallback(() => {
    if (!mountedRef.current) return;
    
    const video = videoRef.current;
    logDebug('LOADED_DATA', { 
      mediaId: mediaId?.slice(0, 8),
      readyState: video?.readyState
    });
    
    setIsReady(true);
    
    // Don't hide poster here - wait for requestVideoFrameCallback
    // Only trigger first frame detection
    if (video) {
      waitForFirstFrame(video);

      const debugId = (window as any).__DEBUG_MEDIA_AUTOPLAY_ID as string | undefined;
      const id = video.dataset.mediaAutoplayId;
      if (debugId && id === debugId) {
        console.log('[AutoplayDebug][HLSPlayer] event:loadeddata', {
          id: id.slice(0, 8),
          currentSrc: video.currentSrc,
          hasSrcAttr: video.hasAttribute('src'),
          readyState: video.readyState,
          currentTime: video.currentTime,
          duration: Number.isFinite(video.duration) ? video.duration : null,
          isAttached: isAttachedRef.current,
        });
      }
    }
    
    onLoadedData?.();
    
    // Boot timeline: log first video loadeddata and canplay
    if (mediaId) {
      logFirstVideoLoadedData(mediaId);
      logFirstVideoCanplay(mediaId);
    }
  }, [onLoadedData, waitForFirstFrame, mediaId]);
  
  const handlePlay = useCallback(() => {
    if (!mountedRef.current) return;
    
    const video = videoRef.current;
    logDebug('PLAY', { mediaId: mediaId?.slice(0, 8) });
    
    setIsPlaying(true);
    setHasError(false);
    
    // Boot timeline: log first video playing
    if (mediaId) {
      logFirstVideoPlaying(mediaId);
    }
    
    // Start TTFF timer on play
    if (!ttffFiredRef.current && ttffStartRef.current === 0) {
      ttffStartRef.current = performance.now();
    }
    
    // If first frame not yet detected, trigger detection now
    if (video) {
      const debugId = (window as any).__DEBUG_MEDIA_AUTOPLAY_ID as string | undefined;
      const id = video.dataset.mediaAutoplayId;
      if (debugId && id === debugId) {
        console.log('[AutoplayDebug][HLSPlayer] event:play', {
          id: id.slice(0, 8),
          currentSrc: video.currentSrc,
          readyState: video.readyState,
          currentTime: video.currentTime,
          duration: Number.isFinite(video.duration) ? video.duration : null,
          isAttached: isAttachedRef.current,
        });
      }

      if (!hasFirstFrame) {
        waitForFirstFrame(video);
      }
    }
    
    onPlay?.();
  }, [onPlay, hasFirstFrame, waitForFirstFrame]);
  
  const handlePause = useCallback(() => {
    if (!mountedRef.current) return;
    
    const video = videoRef.current;
    logDebug('PAUSE', { mediaId: mediaId?.slice(0, 8) });
    
    setIsPlaying(false);

    if (video) {
      const debugId = (window as any).__DEBUG_MEDIA_AUTOPLAY_ID as string | undefined;
      const id = video.dataset.mediaAutoplayId;
      if (debugId && id === debugId) {
        console.log('[AutoplayDebug][HLSPlayer] event:pause', {
          id: id.slice(0, 8),
          currentSrc: video.currentSrc,
          readyState: video.readyState,
          currentTime: video.currentTime,
          isAttached: isAttachedRef.current,
        });
      }
    }

    // Do NOT re-show poster on pause - keep last video frame visible
    // Poster only comes back on detach/ended/error
    onPause?.();
  }, [onPause, mediaId]);
  
  const handleEnded = useCallback(() => {
    if (!mountedRef.current) return;
    
    setIsPlaying(false);
    // With paused-video-first, video stays at last frame on ended (no placeholder)
    // Only reset if explicitly needed for non-looping video restart
    onEnded?.();
  }, [onEnded]);
  
  const handleError = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!mountedRef.current) return;
    
    const video = e.currentTarget;
    
    logDebug('ERROR', { 
      mediaId: mediaId?.slice(0, 8),
      error: video.error?.message
    });
    
    setHasError(true);
    // Show placeholder on error so user sees loading state for retry
    setShowPlaceholder(true);
    
    // RUM: Record failure
    if (mediaId) {
      recordFailure(mediaId, video.error?.message || 'video_element_error', true);
    }
    
    onError?.(new Error(video.error?.message || 'Video playback error'));
  }, [onError, mediaId]);
  
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !onTimeUpdate) return;
    onTimeUpdate(video.currentTime, video.duration || 0);
  }, [onTimeUpdate]);
  
  // RUM: Handle waiting (rebuffer start)
  const handleWaiting = useCallback(() => {
    // Only track rebuffers after first frame (during playback)
    if (mediaId && hasFirstFrame && isPlaying && rebufferStartRef.current === 0) {
      rebufferStartRef.current = performance.now();
      logDebug('REBUFFER_START', { mediaId: mediaId?.slice(0, 8) });
    }
  }, [mediaId, hasFirstFrame, isPlaying]);
  
  // RUM: Handle playing (rebuffer end)
  const handlePlayingEvent = useCallback(() => {
    if (mediaId && rebufferStartRef.current > 0) {
      const duration = performance.now() - rebufferStartRef.current;
      rebufferStartRef.current = 0;
      logDebug('REBUFFER_END', { mediaId: mediaId?.slice(0, 8), duration: duration.toFixed(0) });
      recordRebuffer(mediaId, duration);
    }
  }, [mediaId]);
  
  // ============ Buffering State Tracking ============
  
  // Compute buffered percentage from video.buffered ranges
  const computeBufferedPct = useCallback(() => {
    const video = videoRef.current;
    if (!video) return 0;
    
    const duration = video.duration;
    if (!duration || !Number.isFinite(duration) || duration <= 0) return 0;
    
    const buffered = video.buffered;
    if (buffered.length === 0) return 0;
    
    // Find the buffered range containing currentTime, or use last range end
    const currentTime = video.currentTime;
    let bufferedEnd = 0;
    
    for (let i = 0; i < buffered.length; i++) {
      const start = buffered.start(i);
      const end = buffered.end(i);
      
      if (currentTime >= start && currentTime <= end) {
        bufferedEnd = end;
        break;
      }
      // Track furthest buffer point as fallback
      if (end > bufferedEnd) {
        bufferedEnd = end;
      }
    }
    
    return Math.min(1, Math.max(0, bufferedEnd / duration));
  }, []);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleWaiting = () => {
      setIsBuffering(true);
      if (mediaId) {
        MediaRuntime.reportBuffering(mediaId);
        MediaRuntime.recordBufferingStart(mediaId);
      }
    };
    const handleStalled = () => {
      setIsBuffering(true);
      if (mediaId) {
        MediaRuntime.reportBuffering(mediaId);
        MediaRuntime.recordBufferingStart(mediaId);
      }
    };
    const handlePlaying = () => {
      const wasBuffering = isBuffering;
      setIsBuffering(false);
      if (mediaId && wasBuffering) {
        MediaRuntime.recordBufferingEnd(mediaId);
      }
    };
    const handleCanPlay = () => {
      const wasBuffering = isBuffering;
      setIsBuffering(false);
      if (mediaId && wasBuffering) {
        MediaRuntime.recordBufferingEnd(mediaId);
      }
    };
    const handleCanPlayThrough = () => {
      setIsBuffering(false);
      onCanPlayThrough?.();
    };
    const handleProgress = () => setBufferedPct(computeBufferedPct());
    // Also update bufferedPct on timeupdate (some browsers fire progress infrequently)
    const handleTimeUpdate = () => setBufferedPct(computeBufferedPct());
    
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('stalled', handleStalled);
    video.addEventListener('playing', handlePlaying);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('canplaythrough', handleCanPlayThrough);
    video.addEventListener('progress', handleProgress);
    video.addEventListener('timeupdate', handleTimeUpdate);
    
    // Initial buffered pct
    setBufferedPct(computeBufferedPct());
    
    return () => {
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('stalled', handleStalled);
      video.removeEventListener('playing', handlePlaying);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('canplaythrough', handleCanPlayThrough);
      video.removeEventListener('progress', handleProgress);
      video.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [computeBufferedPct, mediaId, isBuffering]);
  
  const handleClick = useCallback(() => {
    if (externallyManaged) {
      onClick?.();
      return;
    }
    
    const video = videoRef.current;
    if (!video) return;
    
    if (video.paused) {
      safePlay(video);
    } else {
      video.pause();
    }
    
    onClick?.();
  }, [externallyManaged, onClick]);
  
  // ============ Retry Handler ============
  
  const handleRetry = useCallback(async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    const videoEl = videoRef.current;
    if (!videoEl) return;
    
    logVideoTelemetry('video_retry_clicked', { videoId: telemetryVideoId });
    
    // Reset all error states
    setShowUnavailable(false);
    setHasError(false);
    setFirstFrameError(false);
    setHasFirstFrame(false);
    setShowPlaceholder(true);
    setLastError(null);
    setTriedMp4Fallback(false);
    
    // Reset first-frame detection guards
    firstFrameRequestedRef.current = false;
    ttffFiredRef.current = false;
    
    // Clear format markers
    videoEl.removeAttribute('data-format-error');
    videoEl.removeAttribute('data-autoplay-blocked');
    
    // Hard reset video element
    try {
      videoEl.pause();
      videoEl.currentTime = 0;
    } catch {}
    
    // Clear any <source> children
    try {
      while (videoEl.firstChild) videoEl.removeChild(videoEl.firstChild);
    } catch {}
    
    try {
      videoEl.removeAttribute('src');
      videoEl.load();
    } catch {}
    
    // Re-run the normal setup path (await it since setupSource is async)
    try {
      await setupSourceRef.current?.();
    } catch (err) {
      setShowUnavailable(true);
      setLastError('retry_setup_failed');
      logVideoTelemetry('video_unavailable_shown', { videoId: telemetryVideoId });
      return;
    }
    
    // If autoplay should happen, try
    if (autoplay && !managedByMediaRuntime) {
      try {
        await safePlay(videoEl);
      } catch {}
    }
  }, [src, autoplay, managedByMediaRuntime, telemetryVideoId]);
  
  // ============ Mute Toggle ============
  
  const handleMuteToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    const video = videoRef.current;
    if (!video) return;
    
    const newMuted = !isMutedLocal;
    video.muted = newMuted;
    setIsMutedLocal(newMuted);
  }, [isMutedLocal]);
  
  // ============ Aspect Ratio Class ============
  // FIX: Never use 'auto' - default to safe values to prevent zoom flash
  // Auto aspect ratios cause layout shifts when video metadata loads
  
  const safeAspectRatio = aspectRatio === 'auto' || !aspectRatio 
    ? '9:16'  // Default to portrait for Clubhouse/feed videos
    : aspectRatio;
  
  const aspectClasses: Record<string, string> = {
    '3:4': 'aspect-[3/4]',
    '16:9': 'aspect-video',
    '1:1': 'aspect-square',
    '9:16': 'aspect-[9/16]',
  };
  
  const aspectClass = aspectClasses[safeAspectRatio] || 'aspect-[9/16]';
  
  // Helper to get CSS aspect-ratio value for inline styles (extra safety)
  const getAspectRatioValue = (ratio: string): string => {
    const ratioMap: Record<string, string> = {
      '3:4': '3/4',
      '16:9': '16/9',
      '1:1': '1/1',
      '9:16': '9/16',
    };
    return ratioMap[ratio] || '9/16';
  };
  
  const objectFitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';
  
  return (
    <div 
      className={cn('relative overflow-hidden bg-black', aspectClass, className)}
      style={{
        // Lock container dimensions with inline style for extra safety against zoom flash
        aspectRatio: getAspectRatioValue(safeAspectRatio),
        // CSS containment to prevent layout shifts
        contain: 'layout paint',
      }}
    >
      {/* Video Element - PAUSED-VIDEO-FIRST: Video IS the preview */}
      {/* Loads paused at frame 0, displays that frame, then unpauses on play */}
      <video
        ref={videoRef}
        className={cn(
          'absolute inset-0 w-full h-full',
          objectFitClass,
          // GPU compositing hints for WebView - prevents flicker
          'will-change-opacity backface-hidden transform-gpu'
        )}
        style={{ 
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          // Video always at full opacity - placeholder overlays when loading
          opacity: 1,
        }}
        // Core playback
        muted
        playsInline
        loop={loop}
        preload="auto" // CRITICAL: preload="auto" to load first frame
        crossOrigin="anonymous"
        
        // Disable default controls
        controls={false}
        disablePictureInPicture
        controlsList="nodownload noplaybackrate noremoteplayback"
        
        // Events
        onLoadedData={handleLoadedData}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        onTimeUpdate={handleTimeUpdate}
        onWaiting={handleWaiting}
        onPlaying={handlePlayingEvent}
        onClick={handleClick}
      />
      
      {/* Loading Placeholder - shown until first video frame is painted */}
      {/* This is NOT a poster image swap - it's just a loading indicator */}
      {/* GATING: For videos managed by MediaRuntime on feed surfaces, never show spinner */}
      {/* The visibility gating system ensures we only render when ready */}
      {(() => {
        const shouldShowSpinner = showPlaceholder && !hasError && !showUnavailable;
        // GATING: For videos managed by MediaRuntime (feed/clubhouse), never show spinner
        // The visibility gating system ensures we only render cards when video is ready
        const isGatedContext = managedByMediaRuntime === true;
        const actuallyShowSpinner = shouldShowSpinner && !isGatedContext;
        
        if (!actuallyShowSpinner) return null;
        
        return (
          <div 
            className={cn(
              'absolute inset-0 z-10 flex items-center justify-center bg-black',
              'transition-opacity duration-150 ease-out',
              hasFirstFrame ? 'opacity-0 pointer-events-none' : 'opacity-100'
            )}
          >
            {customLoadingComponent || (
              <div className="w-8 h-8 border-2 border-gray-700 border-t-gray-500 rounded-full animate-spin" />
            )}
          </div>
        );
      })()}
      
      {/* First Frame Error State - Paused video mode only, shows on timeout */}
      {firstFrameError && !hasError && !showUnavailable && (
        <VideoErrorState 
          message="Video taking too long to load"
          onRetry={handleRetry}
          showRetry
        />
      )}
      
      {/* Play Button Overlay */}
      {showPlayButton && !isPlaying && !hasError && isReady && (
        <button
          className="absolute inset-0 flex items-center justify-center z-20 bg-black/20"
          onClick={handleClick}
          aria-label="Play video"
        >
          <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
            <Play className="w-6 h-6 text-white fill-white" />
          </div>
        </button>
      )}
      
      {/* Error State / Video Unavailable Overlay */}
      {(hasError || showUnavailable) && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm px-4 text-center">
          <div className="text-white text-sm font-semibold">Video unavailable</div>
          <div className="text-white/70 text-xs mt-1">Tap retry or swipe to skip</div>
          
          <button
            className="mt-3 rounded-full bg-white/15 px-4 py-2 text-white text-xs font-medium hover:bg-white/20 active:bg-white/25"
            onClick={handleRetry}
            aria-label="Retry playback"
          >
            Retry
          </button>
          
          {process.env.NODE_ENV !== 'production' && lastError && (
            <div className="mt-3 text-white/50 text-[10px] break-words max-w-[260px]">
              {lastError}
            </div>
          )}
        </div>
      )}
      
      {/* HD Badge - shows briefly when video upgrades to HD quality */}
      {showHDBadge && (
        <div
          className="absolute top-4 right-4 px-2 py-1 rounded text-white text-xs font-semibold z-20 animate-fade-in"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
          }}
        >
          HD
        </div>
      )}
      
      {/* Mute Button */}
      {showMuteButton && (
        <button
          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center z-20 hover:bg-black/70 transition-colors"
          onClick={handleMuteToggle}
          aria-label={isMutedLocal ? 'Unmute' : 'Mute'}
        >
          {isMutedLocal ? (
            <VolumeX className="w-4 h-4 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 text-white" />
          )}
        </button>
      )}
      
      {/* Scrubber Overlay - Always visible when mediaId exists */}
      {(showScrubber !== false) && mediaId && !hasError && (
        <VideoScrubber
          videoEl={videoRef.current}
          mediaId={mediaId}
          height={3}
          bufferedPct={bufferedPct}
          isBuffering={isBuffering}
          hasFirstFrame={hasFirstFrame}
          isAttached={isAttachedRef.current}
        />
      )}
    </div>
  );
});

HLSPlayer.displayName = 'HLSPlayer';

export default memo(HLSPlayer);
