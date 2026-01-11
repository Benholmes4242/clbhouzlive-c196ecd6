/**
 * HLSPlayer - Unified video player component
 * Single player for all HLS video across grids, cards, modals, and mini-player
 * 
 * Features:
 * - WebView-safe (inline attributes baked in)
 * - safePlay everywhere (no direct .play())
 * - Poster crossfade (no jump/flash)
 * - Error handling with retry UI (no grey boxes)
 * - Native HLS on iOS, HLS.js fallback
 */

import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle, memo, useMemo } from 'react';
import { Play, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { safePlay, isIOS } from '@/utils/safePlay';
import { loadHlsJs } from '@/utils/hlsLoader';
import type HlsType from 'hls.js';
import { cn } from '@/lib/utils';
import { VideoScrubber } from '@/components/video/VideoScrubber';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import { 
  logFirstVideoMounted, 
  logFirstVideoCanplay, 
  logFirstVideoPlaying,
  logFirstVideoLoadedData,
  logFirstMediaPosterLoaded 
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
// FLAGS import removed - paused video mode is now permanent
import { VideoLoadingSpinner } from '@/media/components/VideoLoadingSpinner';
import { VideoErrorState } from '@/media/components/VideoErrorState';

// Adaptive first frame timeout based on connection quality
const getAdaptiveTimeout = (): number => {
  if (typeof navigator === 'undefined') return 15000;
  const connection = (navigator as any).connection;
  
  if (!connection) {
    return 15000; // Default 15s if no connection API
  }
  
  switch (connection.effectiveType) {
    case 'slow-2g':
      return 30000; // 30 seconds for very slow
    case '2g':
      return 25000; // 25 seconds
    case '3g':
      return 20000; // 20 seconds
    case '4g':
    default:
      return 12000; // 12 seconds for fast connections
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
  /** @deprecated Use usePausedVideo instead. Poster image shown before video loads. */
  poster?: string;
  mp4FallbackUrl?: string; // Optional MP4 fallback URL to try when HLS fails
  
  // Playback
  autoplay?: boolean;
  muted?: boolean;
  loop?: boolean;
  
  // Display
  className?: string;
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
  
  // Video System: Paused Video Mode (default behavior)
  /**
   * Controls video loading behavior.
   * If false: Uses poster image mode (legacy behavior)
   * If true or undefined: Uses paused video mode (default, shows first frame)
   * @default undefined (paused video mode)
   */
  usePausedVideo?: boolean;
  
  /**
   * Custom loading component to show while first frame loads (paused video mode only).
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
  poster,
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
  onTimeUpdate,
  onFatalError,
  externallyManaged = false,
  startTime,
  preload = 'metadata',
  managedByMediaRuntime = false,
  showScrubber,
  mediaId,
  usePausedVideo,
  customLoadingComponent,
}, ref) => {

  // ============ Instant Playback Mode (Poster Crossfade) ============
  // Always use poster crossfade for instant perceived playback
  // The poster is shown until first video frame is ready, then crossfades
  const hasPosterImage = !!poster;
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const posterRef = useRef<HTMLDivElement>(null); // Ref for synchronous poster hiding
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
  
  // RUM: Rebuffer tracking ref
  const rebufferStartRef = useRef<number>(0);
  
  // ============ Debug: Log Component Mount ============
  useEffect(() => {
    const shortSrc = src?.substring(src.lastIndexOf('/') + 1, src.lastIndexOf('/') + 9) || 'unknown';
    logDebug('MOUNT', { 
      src: shortSrc, 
      autoplay, 
      managedByMediaRuntime,
      hasPoster: !!poster,
      mediaId: mediaId?.slice(0, 8)
    });
    
    // Boot timeline: log first video mount
    if (mediaId) {
      logFirstVideoMounted(mediaId, src);
      
      // RUM: Start video session tracking
      const surface = managedByMediaRuntime ? 'feed' : 'standalone';
      startVideoSession(mediaId, surface, src);
    }
    
    return () => {
      logDebug('UNMOUNT', { src: shortSrc, mediaId: mediaId?.slice(0, 8) });
      
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
  const [isPosterVisible, setIsPosterVisible] = useState(true);
  const [isPosterLoaded, setIsPosterLoaded] = useState(false);
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
  
  // ============ Derived State for Poster vs Paused Video Mode ============
  // INSTANT PLAYBACK: Always show poster/placeholder until video is ready
  // This completely eliminates the spinner - the poster IS the loading state
  const shouldShowPoster = useMemo(() => {
    // Show poster layer until first frame is ready (even if no poster image - shows black bg)
    return !hasFirstFrame;
  }, [hasFirstFrame]);
  
  // COMPLETELY DISABLED: Never show spinner
  // The poster layer (with fallback to black bg) acts as the loading state
  // This achieves Instagram/TikTok-like perceived instant playback
  const shouldShowLoadingSpinner = false;

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
        cleanupTimeUpdateListener(); // Cleanup any lingering listener
        setHasFirstFrame(false);
        setIsPosterVisible(true);
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
      
      // Clear src without flash - keep poster visible
      video.removeAttribute('src');
      video.load(); // Reset video element state
      setIsPosterVisible(true);
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

    // AUTOPLAY_EFFECT_TRIGGERED log removed for cleaner console
    // The actual play attempts are logged by MediaRuntime

    // Update muted state
    video.muted = muted;

    const attemptPlay = () => {
      if (!video.isConnected) return;
      if (!autoplayRef.current) return;
      if (!video.paused) return;

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
  }, [autoplay, muted, managedByMediaRuntime, mediaId]);
  
  // ============ HLS Setup ============
  
  // Ref to hold setupSource function for attach() to call
  const setupSourceRef = useRef<(() => Promise<void>) | null>(null);
  
  // Setup generation token to prevent stale async work from attaching
  const setupGenRef = useRef(0);
  
  // Stable telemetry videoId (never undefined)
  const telemetryVideoId = mediaId ?? src?.split('/').pop()?.split('.')[0] ?? 'unknown';
  
  // Helper to cleanup timeupdate listener
  const cleanupTimeUpdateListener = useCallback(() => {
    const video = videoRef.current;
    if (video && timeUpdateListenerRef.current) {
      video.removeEventListener('timeupdate', timeUpdateListenerRef.current);
      timeUpdateListenerRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    
    // Skip if detached
    if (!isAttachedRef.current) return;
    
    // Reset all state for new src
    mountedRef.current = true;
    firstFrameRequestedRef.current = false;
    cleanupTimeUpdateListener();
    setHasError(false);
    setIsReady(false);
    setHasFirstFrame(false);
    setIsPosterVisible(true);
    
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
      
      
      if (!useHlsJs) {
        // Native playback
        video.src = src;
        
        
        // Native HLS error handler for consistent retry/overlay behavior
        const onNativeError = () => {
          // Skip if stale setup
          if (myGen !== setupGenRef.current) return;
          
          
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
        // HLS.js playback
        const Hls = await loadHlsJs();
        
        if (!Hls || !Hls.isSupported() || !mountedRef.current) {
          setHasError(true);
          return;
        }
        
        // Get connection-aware quality settings
        const qualityConfig = getConnectionAwareQualityConfig();
        
        // OPTIMIZATION: Force lowest quality for instant start, then upgrade
        // This significantly reduces TTFF (Time To First Frame)
        const hls = new Hls({
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
          if (!data.fatal) return;

          if (!data.fatal) return;

          // Fatal error path
          const videoEl = videoRef.current;

          // Log telemetry for fatal HLS error (use stable videoId)
          logVideoTelemetry('hls_fatal_error', {
            videoId: telemetryVideoId,
            hlsType: data.type,
            hlsDetails: data.details,
            fatal: true
          });
          
          // RUM: Record HLS failure
          if (mediaId) {
            recordFailure(mediaId, `hls_${data.type}_${data.details}`, true);
          }

          // Safety guard
          if (!videoEl) {
            onError?.(new Error(data.details));
            return;
          }

          if (mp4FallbackUrl && !triedMp4Fallback) {
            
            logVideoTelemetry('mp4_fallback_attempted', {
              videoId: telemetryVideoId,
              mp4FallbackUrl: mp4FallbackUrl?.slice(-60)
            });

            setTriedMp4Fallback(true);

            try {
              // Destroy HLS instance cleanly and null the ref
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

              // Attempt playback using hardened logic
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
          return;
        }
        
        // Set ref BEFORE attach/load so cleanup kills the right instance
        hlsRef.current = hls;
        hls.attachMedia(video);
        hls.loadSource(src);
      }
    };
    
    // Store setupSource for attach() to call
    setupSourceRef.current = setupSource;
    
    setupSource();
    
    return () => {
      mountedRef.current = false;
      setupSourceRef.current = null;
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
  }, [src, startTime, onError, cleanupTimeUpdateListener]);
  
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

            // Critical: reset first-frame detection so video layer can fade in again
            firstFrameRequestedRef.current = false;
            cleanupTimeUpdateListener();

            setHasFirstFrame(false);
            setIsPosterVisible(true);
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

            // Critical: reset first-frame detection (otherwise poster can get stuck)
            firstFrameRequestedRef.current = false;
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
            setIsPosterVisible(true);
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
  
  // ============ First Frame Detection (requestVideoFrameCallback) ============
  
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
      // Clear timeout
      if (firstFrameTimeoutRef.current) {
        clearTimeout(firstFrameTimeoutRef.current);
        firstFrameTimeoutRef.current = null;
      }
      // Execute any stored cleanup function
      if (firstFrameCleanupRef.current) {
        firstFrameCleanupRef.current();
        firstFrameCleanupRef.current = null;
      }
      // Cleanup timeupdate listener
      if (timeUpdateListenerRef.current) {
        video.removeEventListener('timeupdate', timeUpdateListenerRef.current);
        timeUpdateListenerRef.current = null;
      }
    };
    
    const markReady = () => {
      if (!mountedRef.current) return;
      
      cleanup();
      
      logDebug('FIRST_FRAME_DETECTED', {
        currentTime: video.currentTime,
        readyState: video.readyState,
        mediaId: mediaId?.slice(0, 8),
        hasPoster: hasPosterImage
      });
      
      // Record TTFF (only once per play cycle)
      if (mediaId && ttffStartRef.current > 0 && !ttffFiredRef.current) {
        ttffFiredRef.current = true;
        const ttffMs = performance.now() - ttffStartRef.current;
        MediaRuntime.recordTtff(mediaId, ttffMs);
        
        // RUM: Record TTFF for analytics
        recordTTFF(mediaId, hasPosterImage);
      }
      
      // INSTANT PLAYBACK: Hide poster via direct DOM manipulation for sync crossfade
      // This prevents any flash by ensuring poster fades BEFORE React re-renders
      if (hasPosterImage) {
        const posterEl = posterRef.current;
        if (posterEl) {
          posterEl.style.opacity = '0';
          posterEl.style.pointerEvents = 'none';
          logDebug('POSTER_HIDDEN_SYNC', { mediaId: mediaId?.slice(0, 8) });
        }
      }
      
      logDebug('VIDEO_READY', { mediaId: mediaId?.slice(0, 8) });
      
      // Then update React state for tracking (non-blocking)
      setHasFirstFrame(true);
      setFirstFrameError(false);
      setIsPosterVisible(false);
    };
    
    const markError = () => {
      if (!mountedRef.current) return;
      
      // AUTO-RETRY: Try once before showing error
      // This helps with slow connections or temporary network issues
      if (!autoRetryAttemptedRef.current) {
        autoRetryAttemptedRef.current = true;
        
        logDebug('FIRST_FRAME_AUTO_RETRY', {
          mediaId: mediaId?.slice(0, 8),
          timeoutMs: FIRST_FRAME_TIMEOUT_MS,
        });
        
        // Try to restart HLS loading
        if (hlsRef.current) {
          try {
            hlsRef.current.stopLoad();
            hlsRef.current.startLoad();
          } catch {}
        }
        
        // Set new timeout for retry attempt
        firstFrameTimeoutRef.current = setTimeout(() => {
          // If still no first frame after retry, show error
          if (!hasFirstFrame && mountedRef.current) {
            cleanup();
            logDebug('FIRST_FRAME_TIMEOUT_AFTER_RETRY', {
              mediaId: mediaId?.slice(0, 8),
            });
            setFirstFrameError(true);
            if (mediaId) {
              recordFailure(mediaId, 'first_frame_timeout_after_retry', false);
            }
          }
        }, FIRST_FRAME_TIMEOUT_MS);
        
        return; // Don't show error yet, wait for retry
      }
      
      cleanup();
      
      logDebug('FIRST_FRAME_TIMEOUT', {
        mediaId: mediaId?.slice(0, 8),
        timeoutMs: FIRST_FRAME_TIMEOUT_MS,
      });
      
      // Set error state (shows retry option)
      setFirstFrameError(true);
      
      // Track timeout event
      if (mediaId) {
        recordFailure(mediaId, 'first_frame_timeout', false);
      }
    };
    
    // Set timeout to prevent infinite loading (fallback safety net)
    firstFrameTimeoutRef.current = setTimeout(() => {
      markError();
    }, FIRST_FRAME_TIMEOUT_MS);

    const anyVideo = video as any;

    // Best option: requestVideoFrameCallback (WKWebView supports this)
    if (typeof anyVideo.requestVideoFrameCallback === 'function') {
      const callbackId = anyVideo.requestVideoFrameCallback(() => markReady());
      // Store cleanup function for cancelVideoFrameCallback
      if (typeof anyVideo.cancelVideoFrameCallback === 'function') {
        firstFrameCleanupRef.current = () => {
          try { anyVideo.cancelVideoFrameCallback(callbackId); } catch {}
        };
      }
      return;
    }

    // Fallback for older browsers: wait for actual frame via timeupdate
    const onTime = () => {
      if (video.currentTime > 0 && video.readyState >= 2) {
        video.removeEventListener('timeupdate', onTime);
        timeUpdateListenerRef.current = null;
        markReady();
      }
    };
    // Store ref for cleanup
    timeUpdateListenerRef.current = onTime;
    video.addEventListener('timeupdate', onTime, { passive: true });
  }, [mediaId, hasPosterImage]);
  
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
    // Only show poster on ended if looping is off
    if (!loop) {
      setIsPosterVisible(true);
      setHasFirstFrame(false);
    }
    onEnded?.();
  }, [onEnded, loop]);
  
  const handleError = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (!mountedRef.current) return;
    
    const video = e.currentTarget;
    
    logDebug('ERROR', { 
      mediaId: mediaId?.slice(0, 8),
      error: video.error?.message
    });
    
    setHasError(true);
    setIsPosterVisible(true);
    
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
    const handleCanPlayThrough = () => setIsBuffering(false);
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
  
  const aspectClass = {
    '3:4': 'aspect-[3/4]',
    '16:9': 'aspect-video',
    '1:1': 'aspect-square',
    '9:16': 'aspect-[9/16]',
    'auto': '',
  }[aspectRatio];
  
  const objectFitClass = objectFit === 'contain' ? 'object-contain' : 'object-cover';
  
  return (
    <div className={cn('relative overflow-hidden bg-black', aspectClass, className)}>
      {/* Poster Layer - ALWAYS shown until first frame is ready (instant playback) */}
      {/* This replaces the spinner with a seamless crossfade for perceived instant start */}
      {shouldShowPoster && (
        <div
          ref={posterRef}
          className={cn(
            'absolute inset-0 w-full h-full transition-opacity duration-200 ease-out',
            // GPU compositing hints for WebView
            'will-change-opacity backface-hidden transform-gpu',
            // Initial z-index positioning - above video
            'z-10'
          )}
          style={{ 
            backfaceVisibility: 'hidden',
            transform: 'translateZ(0)',
            // Crossfade: poster visible until hasFirstFrame
            opacity: hasFirstFrame ? 0 : 1,
            pointerEvents: hasFirstFrame ? 'none' : 'auto'
          }}
        >
          {poster ? (
            <img
              src={poster}
              alt=""
              draggable={false}
              className={cn(
                'w-full h-full',
                objectFitClass
              )}
              onLoad={() => {
                setIsPosterLoaded(true);
                // Boot timeline: log poster loaded
                if (mediaId) {
                  logFirstMediaPosterLoaded(mediaId);
                }
              }}
              onError={() => setIsPosterLoaded(false)}
            />
          ) : (
            <div className="w-full h-full bg-black" />
          )}
        </div>
      )}
      
      {/* Video Element - ALWAYS mounted, underneath poster for seamless crossfade */}
      <video
        ref={videoRef}
        className={cn(
          'absolute inset-0 w-full h-full',
          objectFitClass,
          // GPU compositing hints for WebView - prevents flicker
          'will-change-opacity backface-hidden transform-gpu',
          // Video is always visible - poster layer fades out on top when ready
          'opacity-100'
        )}
        style={{ 
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)'
        }}
        // Core playback
        muted
        playsInline
        loop={loop}
        preload={preload}
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
      
      {/* Loading Spinner - FALLBACK only when no poster available */}
      {/* With proper thumbnail generation, this should rarely show */}
      {shouldShowLoadingSpinner && (
        customLoadingComponent || <VideoLoadingSpinner size="md" />
      )}
      
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
