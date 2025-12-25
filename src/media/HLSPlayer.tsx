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

import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle, memo } from 'react';
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
import { logVideoTelemetry } from '@/utils/videoTelemetry';

// ============ Debug Logging ============
import { DEBUG_HLS_PLAYER, FORCE_HLS_JS } from '@/media/debug';
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
}, ref) => {
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
    }
    
    return () => {
      logDebug('UNMOUNT', { src: shortSrc, mediaId: mediaId?.slice(0, 8) });
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
  const [triedMp4Fallback, setTriedMp4Fallback] = useState(false); // Track if MP4 fallback was attempted
  const [showUnavailable, setShowUnavailable] = useState(false); // Show "Video unavailable" overlay
  const [lastError, setLastError] = useState<string | null>(null); // Last error message for debug
  
  // Buffering state for scrubber
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferedPct, setBufferedPct] = useState(0);
  
  // ============ Debug: Log State Changes ============
  useEffect(() => {
    logDebug('POSTER_VISIBILITY_CHANGE', { 
      isPosterVisible,
      hasFirstFrame,
      videoReadyState: videoRef.current?.readyState,
      mediaId: mediaId?.slice(0, 8)
    });
  }, [isPosterVisible]);
  
  useEffect(() => {
    logDebug('FIRST_FRAME_CHANGE', { 
      hasFirstFrame,
      isPosterVisible,
      videoTime: videoRef.current?.currentTime,
      videoReadyState: videoRef.current?.readyState,
      mediaId: mediaId?.slice(0, 8)
    });
  }, [hasFirstFrame]);
  
  // ============ Imperative Handle ============
  
  // Track if source is attached
  const isAttachedRef = useRef(true);
  
  useImperativeHandle(ref, () => ({
    play: async () => {
      const video = videoRef.current;
      if (!video) return false;
      return safePlay(video);
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
    
    logDebug('AUTOPLAY_EFFECT_TRIGGERED', {
      autoplay,
      managedByMediaRuntime,
      videoPaused: video.paused,
      videoReadyState: video.readyState,
      hasFirstFrame,
      isPosterVisible,
      mediaId: mediaId?.slice(0, 8)
    });
    
    // Update muted state
    video.muted = muted;
    
    if (managedByMediaRuntime) {
      // MediaRuntime-managed: Route playback through MediaRuntime
      if (autoplay && video.paused && mediaId) {
        // Check if node is registered with MediaRuntime
        const isRegistered = MediaRuntime.getNode(mediaId) !== undefined;
        
        if (isRegistered) {
          // Node is registered - use MediaRuntime
          MediaRuntime.requestPlay({
            id: mediaId,
            surface: 'clubhouse',
            reason: 'autoplay',
          });
        } else {
          // Node not yet registered - retry after a short delay
          // This handles the race condition on initial page load
          const retryTimeout = setTimeout(() => {
            const stillRegistered = MediaRuntime.getNode(mediaId) !== undefined;
            if (stillRegistered && video.paused && autoplayRef.current) {
              MediaRuntime.requestPlay({
                id: mediaId,
                surface: 'clubhouse',
                reason: 'autoplay',
              });
            } else if (video.paused && autoplayRef.current) {
              // Fallback: if still not registered after delay, play directly
              // This ensures the first video always starts
              safePlay(video).catch(err => {
                console.warn('[HLSPlayer] Fallback autoplay failed:', err);
              });
            }
          }, 100);
          
          return () => clearTimeout(retryTimeout);
        }
      } else if (!autoplay && !video.paused) {
        video.pause();
      }
    } else {
      // Standalone mode: Handle autoplay directly (hero videos, modals, etc.)
      if (autoplay && video.paused) {
        // This is a standalone video not managed by MediaRuntime
        // Safe to call play() directly
        safePlay(video).catch(err => {
          console.warn('[HLSPlayer] Standalone autoplay failed:', err);
        });
      } else if (!autoplay && !video.paused) {
        video.pause();
      }
    }
  }, [autoplay, muted, managedByMediaRuntime, mediaId]);
  
  // ============ HLS Setup ============
  
  // Ref to hold setupSource function for attach() to call
  const setupSourceRef = useRef<(() => void) | null>(null);
  
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
      const shortSrc = src?.substring(src.lastIndexOf('/') + 1, src.lastIndexOf('/') + 9) || 'unknown';
      logDebug('HLS_LOAD_START', { src: shortSrc, mediaId: mediaId?.slice(0, 8) });
      
      // Cleanup previous
      if (hlsRef.current) {
        try {
          hlsRef.current.stopLoad();
          hlsRef.current.detachMedia();
          hlsRef.current.destroy();
        } catch {}
        hlsRef.current = null;
      }
      
      // Reset video
      video.removeAttribute('src');
      try {
        video.load();
      } catch {}
      
      // Check if native HLS supported (iOS/Safari)
      // Can be overridden with FORCE_HLS_JS for debugging
      const canPlayNatively = !FORCE_HLS_JS && (
        isIOS ||
        video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
        video.canPlayType('application/vnd.apple.mpegURL') !== '' ||
        video.canPlayType('application/x-mpegURL') !== ''
      );
      
      const useHlsJs = !canPlayNatively && src.includes('.m3u8');
      
      console.log('[HLSPlayer] PLAYBACK_PATH', {
        mediaId: mediaId?.slice(0, 8),
        canPlayNatively,
        forceHlsJs: FORCE_HLS_JS,
        isIOS,
        isM3u8: src.includes('.m3u8'),
        path: useHlsJs ? 'HLS.js' : 'NATIVE',
      });
      
      if (!useHlsJs) {
        // Native playback - add timing logs
        console.log('[HLSPlayer] NATIVE_START', { mediaId: mediaId?.slice(0, 8) });
        video.src = src;
        
        // Track native loading events
        const nativeLoadStart = performance.now();
        const onLoadedData = () => {
          console.log('[HLSPlayer] NATIVE_LOADED_DATA', {
            mediaId: mediaId?.slice(0, 8),
            timeMs: (performance.now() - nativeLoadStart).toFixed(0),
            readyState: video.readyState,
            duration: video.duration?.toFixed(2),
          });
        };
        video.addEventListener('loadeddata', onLoadedData, { once: true });
        
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
          console.error('[HLSPlayer] HLS.js not supported');
          setHasError(true);
          return;
        }
        
        const hls = new Hls({
          // Performance: Start with lowest quality for fast first frame
          startLevel: 0, // Force lowest quality initially (then adapt up)
          
          // Buffer settings for fast startup
          maxBufferLength: 10, // Buffer 10 seconds ahead
          maxMaxBufferLength: 20,
          backBufferLength: 4,
          
          // Fast quality switching - start with low estimate
          abrEwmaDefaultEstimate: 500000, // Start with 500kbps estimate
          
          // Faster error recovery
          fragLoadingTimeOut: 10000,
          manifestLoadingTimeOut: 10000,
        });
        
        hls.on(Hls.Events.ERROR, async (_, data) => {
          console.error('[HLSPlayer] HLS error:', data.type, data.details);

          if (!data.fatal) return;

          // Fatal error path
          const videoEl = videoRef.current;

          // Log telemetry for fatal HLS error
          logVideoTelemetry('hls_fatal_error', {
            videoId: mediaId,
            hlsType: data.type,
            hlsDetails: data.details,
            fatal: true
          });

          // Safety guard
          if (!videoEl) {
            onError?.(new Error(data.details));
            return;
          }

          // Attempt MP4 fallback if available and not already tried
          if (mp4FallbackUrl && !triedMp4Fallback) {
            console.warn('[HLSPlayer] 🔁 Attempting MP4 fallback');
            
            logVideoTelemetry('mp4_fallback_attempted', {
              videoId: mediaId,
              mp4FallbackUrl: mp4FallbackUrl?.slice(-60)
            });

            setTriedMp4Fallback(true);

            try {
              // Destroy HLS instance cleanly
              try {
                hls.destroy();
              } catch {}

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
                console.info('[HLSPlayer] ✅ MP4 fallback playback started');
                logVideoTelemetry('mp4_fallback_succeeded', { videoId: mediaId });
                return;
              }

              // MP4 failed → propagate fatal
              console.error('[HLSPlayer] ❌ MP4 fallback failed');
              logVideoTelemetry('mp4_fallback_failed', {
                videoId: mediaId,
                reason: 'safePlay_returned_false'
              });
              onFatalError?.(new Error('MP4 fallback failed'), true);
              setHasError(true);
              setShowUnavailable(true);
              setLastError('MP4 fallback failed');
              logVideoTelemetry('video_unavailable_shown', { videoId: mediaId });
              return;

            } catch (err) {
              console.error('[HLSPlayer] ❌ MP4 fallback exception', err);
              logVideoTelemetry('mp4_fallback_failed', {
                videoId: mediaId,
                reason: err instanceof Error ? err.message : 'unknown_exception'
              });
              onFatalError?.(err instanceof Error ? err : new Error('MP4 fallback error'), true);
              setHasError(true);
              setShowUnavailable(true);
              setLastError(err instanceof Error ? err.message : 'MP4 fallback error');
              logVideoTelemetry('video_unavailable_shown', { videoId: mediaId });
              return;
            }
          }

          // No fallback possible or already tried
          setHasError(true);
          setShowUnavailable(true);
          setLastError(data.details ?? 'unknown_error');
          logVideoTelemetry('video_unavailable_shown', { videoId: mediaId });
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
          
          console.log('[HLSPlayer] MANIFEST_PARSED', {
            mediaId: mediaId?.slice(0, 8),
            levels,
            currentLevel: hls.currentLevel,
            startLevel: hls.startLevel,
            readyState: video.readyState,
            timestamp: parseTime.toFixed(1),
          });
          
          // CRITICAL: Immediately start loading video segments to reduce TTFF
          hls.startLoad(-1);
          
          console.log('[HLSPlayer] startLoad(-1) called', {
            mediaId: mediaId?.slice(0, 8),
            loadLevel: hls.loadLevel,
            autoLevelEnabled: hls.autoLevelEnabled,
            timestamp: performance.now().toFixed(1),
          });
          
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
        
        // Log quality level switches
        hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
          const level = hls.levels?.[data.level];
          console.log('[HLSPlayer] LEVEL_SWITCHED', {
            mediaId: mediaId?.slice(0, 8),
            level: data.level,
            width: level?.width,
            height: level?.height,
            bitrateKbps: level?.bitrate ? Math.round(level.bitrate / 1000) : 'N/A',
            timestamp: performance.now().toFixed(1),
          });
        });
        
        // Diagnostic: Track when fragments start loading with detailed info
        hls.on(Hls.Events.FRAG_LOADING, (_, data) => {
          console.log('[HLSPlayer] FRAG_LOADING', {
            mediaId: mediaId?.slice(0, 8),
            segmentNumber: data.frag.sn,
            duration: data.frag.duration?.toFixed(2) + 's',
            level: data.frag.level,
            type: data.frag.type,
            url: data.frag.url?.slice(-50),
            timestamp: performance.now().toFixed(1),
          });
        });
        
        // Diagnostic: Track when fragments complete loading with size/bitrate
        hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
          const stats = data.frag.stats;
          const bytesLoaded = stats?.total || 0;
          const loadingStart = stats?.loading?.start || 0;
          const loadingEnd = stats?.loading?.end || 0;
          const timeToLoad = loadingEnd - loadingStart;
          const bitrate = data.frag.duration > 0 
            ? Math.round((bytesLoaded * 8) / (data.frag.duration * 1000)) 
            : 0;
          
          console.log('[HLSPlayer] FRAG_LOADED', {
            mediaId: mediaId?.slice(0, 8),
            segmentNumber: data.frag.sn,
            duration: data.frag.duration?.toFixed(2) + 's',
            sizeKB: (bytesLoaded / 1024).toFixed(1),
            loadTimeMs: timeToLoad.toFixed(0),
            bitrateKbps: bitrate,
            level: data.frag.level,
            timestamp: performance.now().toFixed(1),
          });
        });
        
        // Diagnostic: Track buffer appending for discover hero
        hls.on(Hls.Events.BUFFER_APPENDED, (_, data) => {
          console.log('[HLSPlayer] BUFFER_APPENDED', {
            mediaId: mediaId?.slice(0, 8),
            type: data.type,
            timestamp: performance.now().toFixed(1),
          });
        });
        
        hls.attachMedia(video);
        hls.loadSource(src);
        hlsRef.current = hls;
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
    
    const markReady = () => {
      if (!mountedRef.current) return;
      
      logDebug('FIRST_FRAME_DETECTED', {
        currentTime: video.currentTime,
        readyState: video.readyState,
        mediaId: mediaId?.slice(0, 8),
        willHidePoster: true
      });
      
      // Cleanup any fallback listener
      if (timeUpdateListenerRef.current) {
        video.removeEventListener('timeupdate', timeUpdateListenerRef.current);
        timeUpdateListenerRef.current = null;
      }
      
      // Record TTFF (only once per play cycle)
      if (mediaId && ttffStartRef.current > 0 && !ttffFiredRef.current) {
        ttffFiredRef.current = true;
        const ttffMs = performance.now() - ttffStartRef.current;
        logDebug('TTFF_RECORDED', { ttffMs: ttffMs.toFixed(2), mediaId: mediaId?.slice(0, 8) });
        MediaRuntime.recordTtff(mediaId, ttffMs);
      }
      
      // CRITICAL FIX: Hide poster and show video IMMEDIATELY via direct DOM manipulation
      // This prevents the 60ms black flash caused by async React state updates
      const posterEl = posterRef.current;
      if (posterEl) {
        posterEl.style.opacity = '0';
        posterEl.style.pointerEvents = 'none';
        logDebug('POSTER_HIDDEN_SYNC', { mediaId: mediaId?.slice(0, 8) });
      }
      
      // Show video immediately
      video.style.opacity = '1';
      logDebug('VIDEO_SHOWN_SYNC', { mediaId: mediaId?.slice(0, 8) });
      
      // Then update React state for tracking (non-blocking)
      setHasFirstFrame(true);
      setIsPosterVisible(false);
    };

    const anyVideo = video as any;

    // Best option: requestVideoFrameCallback (WKWebView supports this)
    if (typeof anyVideo.requestVideoFrameCallback === 'function') {
      anyVideo.requestVideoFrameCallback(() => markReady());
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
  }, [mediaId]);
  
  const handleLoadedData = useCallback(() => {
    if (!mountedRef.current) return;
    
    setIsReady(true);
    
    // Don't hide poster here - wait for requestVideoFrameCallback
    // Only trigger first frame detection
    const video = videoRef.current;
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
    const video = videoRef.current;
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
    
    setIsPlaying(false);

    const video = videoRef.current;
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
  }, [onPause]);
  
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
    console.error('[HLSPlayer] Error:', {
      code: video.error?.code,
      message: video.error?.message,
      src: video.currentSrc,
    });
    
    setHasError(true);
    setIsPosterVisible(true);
    onError?.(new Error(video.error?.message || 'Video playback error'));
  }, [onError]);
  
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !onTimeUpdate) return;
    onTimeUpdate(video.currentTime, video.duration || 0);
  }, [onTimeUpdate]);
  
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
    
    logVideoTelemetry('video_retry_clicked', { videoId: mediaId });
    
    // Reset all error states
    setShowUnavailable(false);
    setHasError(false);
    setLastError(null);
    setTriedMp4Fallback(false);
    
    // Clear format markers
    videoEl.removeAttribute('data-format-error');
    videoEl.removeAttribute('data-autoplay-blocked');
    
    // Full reset
    try {
      videoEl.pause();
      videoEl.removeAttribute('src');
      videoEl.load();
    } catch {}
    
    // Re-run the normal setup path
    try {
      setupSourceRef.current?.();
    } catch (err) {
      setShowUnavailable(true);
      setLastError('retry_setup_failed');
      logVideoTelemetry('video_unavailable_shown', { videoId: mediaId });
      return;
    }
    
    // If autoplay should happen, try
    if (autoplay && !managedByMediaRuntime) {
      try {
        await safePlay(videoEl);
      } catch {}
    }
  }, [src, autoplay, managedByMediaRuntime, mediaId]);
  
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
      {/* Poster Layer - ALWAYS mounted, uses ref for synchronous opacity control */}
      {/* Direct DOM manipulation via posterRef prevents black flash */}
      <div
        ref={posterRef}
        className={cn(
          'absolute inset-0 w-full h-full transition-opacity duration-100 ease-linear',
          // GPU compositing hints for WebView
          'will-change-opacity backface-hidden transform-gpu',
          // Initial z-index positioning
          'z-10'
        )}
        style={{ 
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)',
          // Initial opacity controlled by state, then overridden by direct DOM for sync
          opacity: isPosterVisible ? 1 : 0,
          pointerEvents: isPosterVisible ? 'auto' : 'none'
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
            onLoad={() => setIsPosterLoaded(true)}
            onError={() => setIsPosterLoaded(false)}
          />
        ) : (
          <div className="w-full h-full bg-black" />
        )}
      </div>
      
      {/* Video Element - ALWAYS mounted, only opacity transitions */}
      <video
        ref={videoRef}
        className={cn(
          'absolute inset-0 w-full h-full transition-opacity duration-150 ease-linear',
          objectFitClass,
          // GPU compositing hints for WebView - prevents flicker
          'will-change-opacity backface-hidden transform-gpu',
          // Show when first painted frame is ready - poster fades out on top
          hasFirstFrame ? 'opacity-100' : 'opacity-0'
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
        onClick={handleClick}
      />
      
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
