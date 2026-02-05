/**
 * UnifiedVideoPlayer - THE video player for the entire app
 * 
 * Single component that replaces HLSPlayer, HLSVideoCard, and EnhancedVideoPlayer.
 * 
 * Architecture:
 * - Paused-Video-First: Video loads paused, displays first frame, then unpauses
 * - MediaRuntime Integration: Registers with runtime for playback coordination
 * - HLS.js with Native Fallback: HLS.js on most browsers, native on iOS Safari
 * - HLS Pool Integration: Promotes preloaded HLS instances for instant playback
 * - Composition: Controls, scrubber, overlay are optional
 */

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { cn } from '@/lib/utils';
import { loadHlsJs } from '@/utils/hlsLoader';
import { safePlay, isIOS } from '@/utils/safePlay';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import type { MediaSurface } from '@/media/runtime/MediaRuntime';
import { CLOUDFLARE_STREAM_PATTERNS } from '@/media/constants';
import type { PlaybackState, MediaError, AspectRatio } from '@/media/types';
import { VideoOverlay } from './VideoOverlay';
import { NetworkPriorityManager } from '@/utils/video/NetworkPriorityManager';
import { DecoderLimitManager } from '@/utils/video/DecoderLimitManager';
import { VideoControls } from './VideoControls';
import { VideoScrubber } from '@/components/video/VideoScrubber';
import { Volume2, VolumeX } from 'lucide-react';
import { extractCloudflareUid } from '@/utils/videoIdUtils';
import { createCachedHlsLoader } from '@/lib/cachedHlsLoader';
import { HLSPoolManager } from '@/media/HLSPoolManager';
import { useBufferingIndicator } from '@/hooks/useBufferingIndicator';
import { useAudioFade } from '@/hooks/useAudioFade';
import type HlsType from 'hls.js';
import { 
  MOBILE_VIDEO_DEBUG, 
  attachVideoEventLoggers, 
  logAutoplayEffectFire,
  logHlsEvent,
  logHlsError,
  logVideoElementMount,
  logVideoElementUnmount,
} from '@/media/mobileVideoDebug';

// ============ Types ============

export interface UnifiedVideoPlayerProps {
  /** HLS URL, Stream URL, or MP4 URL */
  src?: string;
  /** Cloudflare Stream UID (alternative to src) */
  streamId?: string;
  /** Thumbnail/poster image URL */
  posterUrl?: string;
  /** MP4 fallback URL for error recovery */
  mp4FallbackUrl?: string;
  
  /** Aspect ratio preset or 'auto' */
  aspectRatio?: AspectRatio | '3:4' | '16:9' | '1:1' | '9:16';
  /** Object fit mode */
  objectFit?: 'cover' | 'contain';
  
  /** Enable autoplay when visible */
  autoplay?: boolean;
  /** Start muted */
  muted?: boolean;
  /** Loop playback */
  loop?: boolean;
  
  /** Surface type for priority */
  surface?: MediaSurface;
  
  /** Show controls bar */
  controls?: boolean;
  /** Show progress scrubber */
  scrubber?: boolean;
  /** Show center play button */
  showPlayButton?: boolean;
  /** Show mute toggle button */
  showMuteButton?: boolean;
  /** Show HD quality badge */
  showQualityBadge?: boolean;
  
  /** Preload strategy */
  preload?: 'auto' | 'metadata' | 'none';
  /** Start time in seconds */
  startTime?: number;
  /** Media ID for runtime tracking */
  mediaId?: string;
  /** If true, MediaRuntime controls playback */
  managedByMediaRuntime?: boolean;
  
  /** Additional CSS classes */
  className?: string;
  /** Inline styles */
  style?: React.CSSProperties;
  
  // Callbacks
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  onClick?: () => void;
  onError?: (error: MediaError) => void;
  onTimeUpdate?: (time: number, duration: number) => void;
  onStateChange?: (state: PlaybackState) => void;
  onLoadedData?: () => void;
  onCanPlayThrough?: () => void;
}

export interface UnifiedVideoPlayerRef {
  play: () => Promise<boolean>;
  pause: () => void;
  toggle: () => void;
  seek: (time: number) => void;
  seekToPercent: (percent: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlaybackState: () => PlaybackState;
  isPaused: () => boolean;
  isMuted: () => boolean;
  mute: () => void;
  unmute: () => void;
  toggleMute: () => void;
  getVideoElement: () => HTMLVideoElement | null;
  attach: () => void;
  detach: () => void;
  isAttached: () => boolean;
}

// ============ Component ============

const UnifiedVideoPlayerInner = forwardRef<UnifiedVideoPlayerRef, UnifiedVideoPlayerProps>(
  (props, ref) => {
    const {
      src,
      streamId,
      posterUrl,
      mp4FallbackUrl,
      aspectRatio = 'auto',
      objectFit = 'cover',
      autoplay = false,
      muted = true,
      loop = false,
      surface = 'grid',
      controls = false,
      scrubber = false,
      showPlayButton = false,
      showMuteButton = false,
      showQualityBadge = false,
      preload = 'metadata',
      startTime,
      mediaId,
      managedByMediaRuntime = false,
      className,
      style,
      onPlay,
      onPause,
      onEnded,
      onClick,
      onError,
      onTimeUpdate,
      onStateChange,
      onLoadedData,
      onCanPlayThrough,
    } = props;

    // ============ Refs ============
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const hlsRef = useRef<HlsType | null>(null);
    const mountedRef = useRef(true);
    const isAttachedRef = useRef(true);
    const currentSrcRef = useRef<string | null>(null);
    // FIX #7: Timeout ref for first frame fallback
    const firstFrameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // ============ State ============
    const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [isMutedState, setIsMutedState] = useState(muted);
    const [error, setError] = useState<MediaError | null>(null);
    const [quality, setQuality] = useState(0);
    const [hasFirstFrame, setHasFirstFrame] = useState(false);
    const [showPlaceholder, setShowPlaceholder] = useState(true);
    const [bufferedPct, setBufferedPct] = useState(0);
    
    // ============ TikTok-Level Buffering Indicator ============
    // Increased delay (800ms) prevents spinners for transient network dips
    // Showing a static first-frame is visually superior to a spinner
    const { showBuffering, isBuffering } = useBufferingIndicator(videoRef.current, {
      showDelay: 800,
      minDisplayTime: 400,
    });

    // ============ FIX #10: Audio Fade Hook ============
    // Smooth 150ms volume transitions instead of abrupt mute/unmute
    const { fadeIn, fadeOut } = useAudioFade({ duration: 150, easing: 'easeOut' });

    // ============ Derived Values ============
    const hlsUrl = useMemo(() => {
      if (streamId) {
        return CLOUDFLARE_STREAM_PATTERNS.HLS(streamId);
      }
      return src;
    }, [streamId, src]);

    const poster = useMemo(() => {
      if (posterUrl) return posterUrl;
      if (streamId) {
        return CLOUDFLARE_STREAM_PATTERNS.THUMBNAIL(streamId);
      }
      return undefined;
    }, [posterUrl, streamId]);

    const mp4Fallback = useMemo(() => {
      if (mp4FallbackUrl) return mp4FallbackUrl;
      if (streamId) {
        return CLOUDFLARE_STREAM_PATTERNS.MP4(streamId);
      }
      return undefined;
    }, [mp4FallbackUrl, streamId]);

    const uniqueMediaId = useMemo(() => {
      return mediaId || `video-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }, [mediaId]);

    // Extract Cloudflare UID for cache key consistency
    const cloudflareUid = useMemo(() => {
      return hlsUrl ? extractCloudflareUid(hlsUrl) : '';
    }, [hlsUrl]);

    // ============ Aspect Ratio Styles ============
    const aspectRatioStyle = useMemo(() => {
      if (aspectRatio === 'auto') return {};
      const ratioMap: Record<string, string> = {
        '3:4': '3/4',
        '4:3': '4/3',
        '16:9': '16/9',
        '9:16': '9/16',
        '1:1': '1/1',
        '21:9': '21/9',
      };
      return { aspectRatio: ratioMap[aspectRatio] || aspectRatio };
    }, [aspectRatio]);

    // ============ State Change Handler ============
    const updatePlaybackState = useCallback((newState: PlaybackState) => {
      setPlaybackState(newState);
      onStateChange?.(newState);
    }, [onStateChange]);

    // ============ Imperative Handle ============
    useImperativeHandle(ref, () => ({
      play: async () => {
        const video = videoRef.current;
        if (!video) return false;
        return await safePlay(video);
      },
      pause: () => {
        videoRef.current?.pause();
      },
      toggle: () => {
        const video = videoRef.current;
        if (!video) return;
        if (video.paused) {
          safePlay(video);
        } else {
          video.pause();
        }
      },
      seek: (time: number) => {
        const video = videoRef.current;
        if (video) {
          video.currentTime = time;
        }
      },
      seekToPercent: (percent: number) => {
        const video = videoRef.current;
        if (video && video.duration) {
          video.currentTime = (percent / 100) * video.duration;
        }
      },
      getCurrentTime: () => videoRef.current?.currentTime ?? 0,
      getDuration: () => videoRef.current?.duration ?? 0,
      getPlaybackState: () => playbackState,
      isPaused: () => videoRef.current?.paused ?? true,
      isMuted: () => isMutedState,
      // FIX #10: Use audio fade for smooth mute transition
      mute: async () => {
        if (videoRef.current) {
          setIsMutedState(true);
          await fadeOut(videoRef.current);
        }
      },
      // FIX #10: Use audio fade for smooth unmute transition
      unmute: async () => {
        if (videoRef.current) {
          setIsMutedState(false);
          await fadeIn(videoRef.current, 1);
        }
      },
      // FIX #10: Use audio fade for smooth toggle
      toggleMute: async () => {
        if (videoRef.current) {
          const newMuted = !isMutedState;
          setIsMutedState(newMuted);
          if (newMuted) {
            await fadeOut(videoRef.current);
          } else {
            await fadeIn(videoRef.current, 1);
          }
        }
      },
      getVideoElement: () => videoRef.current,
      isAttached: () => isAttachedRef.current,
      attach: () => {
        if (!isAttachedRef.current && videoRef.current && hlsUrl) {
          isAttachedRef.current = true;
          currentSrcRef.current = null;
          setHasFirstFrame(false);
          setShowPlaceholder(true);
          setPlaybackState('idle');
        }
      },
      detach: () => {
        const video = videoRef.current;
        if (!video) return;
        
        isAttachedRef.current = false;
        currentSrcRef.current = null;
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
        setPlaybackState('idle');
      },
    }), [playbackState, isMutedState, hlsUrl]);

    // ============ Sync Muted State ============
    useEffect(() => {
      setIsMutedState(muted);
      if (videoRef.current) {
        videoRef.current.muted = muted;
      }
    }, [muted]);

    // ============ Video Element Lifecycle Logging ============
    useEffect(() => {
      const video = videoRef.current;
      const id = cloudflareUid || uniqueMediaId;
      if (!video) return;
      
      // Log mount
      logVideoElementMount(id, video);
      
      // Log unmount on cleanup
      return () => {
        logVideoElementUnmount(id);
      };
    }, [cloudflareUid, uniqueMediaId]);

    // ============ Mobile Video Debug Event Loggers ============
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;
      
      // Attach comprehensive event loggers for mobile debugging
      const cleanup = attachVideoEventLoggers(video, cloudflareUid || uniqueMediaId);
      return cleanup;
    }, [cloudflareUid, uniqueMediaId]);

    // ============ Video Event Handlers ============
    useEffect(() => {
      const video = videoRef.current;
      if (!video) return;

      const handlePlay = () => {
        updatePlaybackState('playing');
        onPlay?.();
      };

      const handlePause = () => {
        updatePlaybackState('paused');
        onPause?.();
      };

      const handleEnded = () => {
        updatePlaybackState('ended');
        onEnded?.();
      };

      const handleWaiting = () => {
        // Note: isBuffering is now managed by useBufferingIndicator hook
        updatePlaybackState('loading');
      };

      const handlePlaying = () => {
        // Note: isBuffering is now managed by useBufferingIndicator hook
        updatePlaybackState('playing');
      };

      const handleCanPlay = () => {
        // [Bootstrap Diagnostic] First video canplay
        console.log('[Bootstrap] Video canplay', { 
          timestamp: performance.now().toFixed(1),
          uniqueMediaId,
          readyState: video.readyState
        });
        
        // Exit priority mode when first video is ready
        // (The manager handles the 3s window internally)
        NetworkPriorityManager.exitPriorityMode();
        
        if (playbackState === 'loading' || playbackState === 'idle') {
          updatePlaybackState('ready');
        }
      };

      const handleLoadedData = () => {
        // FIX #7: Clear first frame timeout when loadeddata fires normally
        if (firstFrameTimeoutRef.current) {
          clearTimeout(firstFrameTimeoutRef.current);
          firstFrameTimeoutRef.current = null;
        }
        setHasFirstFrame(true);
        setShowPlaceholder(false);
        updatePlaybackState('ready');
        onLoadedData?.();
      };

      const handleCanPlayThrough = () => {
        onCanPlayThrough?.();
      };

      const handleTimeUpdate = () => {
        const time = video.currentTime;
        const dur = video.duration;
        setCurrentTime(time);
        if (Number.isFinite(dur)) {
          setDuration(dur);
        }
        onTimeUpdate?.(time, dur || 0);

        // Update buffered percentage
        if (video.buffered.length > 0 && dur > 0) {
          const bufferedEnd = video.buffered.end(video.buffered.length - 1);
          setBufferedPct(bufferedEnd / dur);
        }
      };

      const handleError = () => {
        const mediaError: MediaError = {
          type: 'unknown',
          message: video.error?.message || 'Video playback error',
          recoverable: !!mp4Fallback,
        };
        setError(mediaError);
        updatePlaybackState('error');
        onError?.(mediaError);
      };

      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('ended', handleEnded);
      video.addEventListener('waiting', handleWaiting);
      video.addEventListener('playing', handlePlaying);
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('loadeddata', handleLoadedData);
      video.addEventListener('canplaythrough', handleCanPlayThrough);
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('error', handleError);

      return () => {
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
        video.removeEventListener('waiting', handleWaiting);
        video.removeEventListener('playing', handlePlaying);
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('loadeddata', handleLoadedData);
        video.removeEventListener('canplaythrough', handleCanPlayThrough);
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('error', handleError);
      };
    }, [mp4Fallback, onPlay, onPause, onEnded, onError, onTimeUpdate, onLoadedData, onCanPlayThrough, updatePlaybackState, playbackState]);

    // ============ HLS Setup ============
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !hlsUrl) return;
      if (!isAttachedRef.current) return;
      
      // GUARD: Skip if same source already loaded (prevents re-render spam)
      // This single check handles both HLS.js and native iOS playback
      if (hlsUrl === currentSrcRef.current) {
        return;
      }
      
      currentSrcRef.current = hlsUrl;
      mountedRef.current = true;
      
      // Reset state for new source
      setError(null);
      setHasFirstFrame(false);
      setShowPlaceholder(true);
      updatePlaybackState('loading');
      
      // FIX #7: Clear any existing first frame timeout
      if (firstFrameTimeoutRef.current) {
        clearTimeout(firstFrameTimeoutRef.current);
        firstFrameTimeoutRef.current = null;
      }
      
      // FIX #7: Set up first frame timeout fallback (3s)
      // If loadeddata never fires (stalled network), force transition if video has any data
      firstFrameTimeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        
        const video = videoRef.current;
        if (!video) return;
        
        // Only force first frame if we haven't already got it and video has some data
        if (!hasFirstFrame && (video.readyState >= 1 || video.buffered.length > 0)) {
          console.log('[UnifiedVideoPlayer] First frame timeout fallback triggered');
          setHasFirstFrame(true);
          setShowPlaceholder(false);
        }
      }, 3000);

      // Cleanup previous HLS instance
      if (hlsRef.current) {
        try {
          hlsRef.current.stopLoad();
          hlsRef.current.detachMedia();
          hlsRef.current.destroy();
        } catch {}
        hlsRef.current = null;
      }

      const setupSource = async () => {
        const video = videoRef.current;
        if (!video) return;

        // Request decoder slot before proceeding
        const slotGranted = DecoderLimitManager.requestSlot(
          uniqueMediaId,
          video,
          autoplay ? 'playing' : 'visible',
          () => {
            // This callback is called if we get evicted
            console.log(`[Video] Evicted from decoder pool: ${uniqueMediaId}`);
            // Detach HLS to free decoder
            if (hlsRef.current) {
              hlsRef.current.stopLoad();
              hlsRef.current.detachMedia();
            }
          }
        );

        if (!slotGranted) {
          console.log(`[Video] Decoder slot denied, skipping setup: ${uniqueMediaId}`);
          return; // Don't attach if no slot available
        }

        // Check for native HLS support (iOS Safari)
        const canPlayNatively = isIOS ||
          video.canPlayType('application/vnd.apple.mpegurl') !== '' ||
          video.canPlayType('application/vnd.apple.mpegURL') !== '';

        const isHlsUrl = hlsUrl.includes('.m3u8');

        if (canPlayNatively || !isHlsUrl) {
          // Native playback - CachedHlsLoader NOT used (Safari/iOS uses native HLS)
          // No additional guard needed - currentSrcRef check above prevents spam
          video.src = hlsUrl;
          video.load();
          
          if (startTime && startTime > 0) {
            video.currentTime = startTime;
          }
          return;
        }

        // HLS.js playback
        try {
          const Hls = await loadHlsJs();
          if (!Hls || !Hls.isSupported() || !mountedRef.current) {
            // Fall back to native
            video.src = hlsUrl;
            return;
          }

          // FIX #2: Check HLS Pool for preloaded instance first
          // This promotes pre-created instances instead of creating new ones
          const pooledHls = HLSPoolManager.promote(hlsUrl, video);
          
          if (pooledHls) {
            // Use promoted instance - already attached to video
            hlsRef.current = pooledHls;
            
            // Re-wire event handlers for the promoted instance
            pooledHls.on(Hls.Events.MANIFEST_PARSED, () => {
              if (MOBILE_VIDEO_DEBUG) {
                logHlsEvent('MANIFEST_PARSED (promoted)', cloudflareUid || uniqueMediaId);
              }
              if (startTime && startTime > 0) {
                video.currentTime = startTime;
              }
              if (autoplay && !managedByMediaRuntime) {
                safePlay(video);
              }
            });

            pooledHls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
              const level = pooledHls.levels[data.level];
              if (level) {
                setQuality(level.height);
              }
            });

            pooledHls.on(Hls.Events.ERROR, (_, data) => {
              if (MOBILE_VIDEO_DEBUG) {
                logHlsError(cloudflareUid || uniqueMediaId, data.fatal, data.type, data.details);
              }
              if (data.fatal && mp4Fallback) {
                pooledHls.destroy();
                hlsRef.current = null;
                video.src = mp4Fallback;
              }
            });

            // Start loading if stopped
            pooledHls.startLoad();
            
            if (MOBILE_VIDEO_DEBUG) {
              logHlsEvent('HLS_POOL_PROMOTED', cloudflareUid || uniqueMediaId);
            }
            return;
          }

          // No pooled instance available - create new one
          const hls = new Hls({
            // PRIORITY FIX: Force lowest quality for first segment, then let ABR take over
            startLevel: 0,
            
            // Buffer optimisations for fast start
            maxBufferLength: 30,           // Don't over-buffer (wastes bandwidth)
            maxMaxBufferLength: 60,        // Hard cap on buffer
            maxBufferSize: 60 * 1000000,   // 60MB buffer size cap
            maxBufferHole: 0.5,            // Tolerate small gaps without stalling
            lowLatencyMode: false,         // We're not live streaming, disable LL-HLS overhead
            backBufferLength: 30,          // Keep 30s of back buffer for seeking
            
            // Fast ABR ramping after first segment
            abrEwmaDefaultEstimate: 1000000,  // Start with 1Mbps estimate (conservative)
            abrBandWidthFactor: 0.95,         // Use 95% of measured bandwidth
            abrBandWidthUpFactor: 0.7,        // Be aggressive ramping UP quality
            abrMaxWithRealBitrate: true,      // Use real bitrate for ABR decisions
            
            // Startup optimisation
            startFragPrefetch: true,          // Prefetch next fragment during current decode
            testBandwidth: false,             // Don't waste time on bandwidth test, just start
            
            // Existing config
            capLevelToPlayerSize: true,
            enableWorker: true,
            // Wire up cached loader for prefetched segments
            loader: cloudflareUid ? createCachedHlsLoader(cloudflareUid) : undefined,
          });

          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            // MOBILE VIDEO DEBUG: Log HLS manifest parsed
            if (MOBILE_VIDEO_DEBUG) {
              logHlsEvent('MANIFEST_PARSED', cloudflareUid || uniqueMediaId);
            }
            
            if (startTime && startTime > 0) {
              video.currentTime = startTime;
            }
            
            // Auto-play if autoplay is enabled and not managed by runtime
            if (autoplay && !managedByMediaRuntime) {
              safePlay(video);
            }
          });

          hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
            const level = hls.levels[data.level];
            if (level) {
              setQuality(level.height);
              // Log level switch for debugging ABR behavior
              console.log(`[HLS] Quality switched to level ${data.level} (${level.height}p)`);
              if (MOBILE_VIDEO_DEBUG) {
                logHlsEvent('LEVEL_SWITCHED', cloudflareUid || uniqueMediaId, { height: level.height });
              }
            }
          });

          // Verification logging for first fragment optimization
          hls.on(Hls.Events.FRAG_LOADED, (_, data) => {
            if (data.frag.sn === 0 || data.frag.sn === 1) {
              console.log(`[HLS] Fragment ${data.frag.sn} loaded - level: ${data.frag.level}, size: ${data.frag.stats.total} bytes`);
            }
          });

          hls.on(Hls.Events.ERROR, (_, data) => {
            // MOBILE VIDEO DEBUG: Log HLS errors
            if (MOBILE_VIDEO_DEBUG) {
              logHlsError(cloudflareUid || uniqueMediaId, data.fatal, data.type, data.details);
            }
            
            if (data.fatal) {
              const mediaError: MediaError = {
                type: 'hls',
                message: data.details || 'HLS playback error',
                recoverable: !!mp4Fallback,
              };
              
              // Try MP4 fallback
              if (mp4Fallback) {
                hls.destroy();
                hlsRef.current = null;
                video.src = mp4Fallback;
              } else {
                setError(mediaError);
                updatePlaybackState('error');
                onError?.(mediaError);
              }
            }
          });

          hls.loadSource(hlsUrl);
          hls.attachMedia(video);
          hlsRef.current = hls;
        } catch (err) {
          // Fall back to native
          video.src = hlsUrl;
        }
      };

      setupSource();

      return () => {
        mountedRef.current = false;
        
        // FIX #7: Clear first frame timeout on cleanup
        if (firstFrameTimeoutRef.current) {
          clearTimeout(firstFrameTimeoutRef.current);
          firstFrameTimeoutRef.current = null;
        }
        
        // Release decoder slot on cleanup
        DecoderLimitManager.releaseSlot(uniqueMediaId);
        
        if (hlsRef.current) {
          try {
            hlsRef.current.stopLoad();
            hlsRef.current.detachMedia();
            hlsRef.current.destroy();
          } catch {}
          hlsRef.current = null;
        }
      };
    }, [hlsUrl, startTime, autoplay, managedByMediaRuntime, mp4Fallback, onError, updatePlaybackState, cloudflareUid, hasFirstFrame]);

    // ============ MediaRuntime Registration ============
    useEffect(() => {
      const video = videoRef.current;
      const container = containerRef.current;
      if (!video || !managedByMediaRuntime) return;

      // Use Cloudflare UID as registration ID for cache key consistency
      const registrationId = cloudflareUid || uniqueMediaId;

      MediaRuntime.registerMedia({
        id: registrationId,
        element: video,
        surface,
        sortIndex: 0,
        observeTarget: container || video,
      });

      // Store ref on element for runtime access
      (video as any).__hlsPlayerRef = {
        detach: () => {
          if (hlsRef.current) {
            hlsRef.current.stopLoad();
            hlsRef.current.detachMedia();
          }
        },
        attach: () => {
          if (hlsRef.current && video) {
            hlsRef.current.attachMedia(video);
            hlsRef.current.startLoad();
          }
        },
      };

      return () => {
        MediaRuntime.unregisterMedia(registrationId);
      };
    }, [uniqueMediaId, cloudflareUid, surface, managedByMediaRuntime]);

    // ============ Autoplay Effect ============
    // CRITICAL: This effect must react to `autoplay` prop changes, not just initial mount.
    // When users scroll to a new video or scroll back to a previous one, `autoplay` changes
    // from false→true based on IntersectionObserver in useVerticalFeedLogic.
    useEffect(() => {
      const video = videoRef.current;
      if (!video || !autoplay || managedByMediaRuntime) return;
      if (!hlsUrl) return;

      // MOBILE VIDEO DEBUG: Log autoplay effect firing
      if (MOBILE_VIDEO_DEBUG) {
        logAutoplayEffectFire(video, cloudflareUid || uniqueMediaId, autoplay);
      }

      // Attempt autoplay - safePlay handles readyState checks and muted fallback
      const attemptAutoplay = () => {
        safePlay(video);
      };

      // Set up listeners for videos still loading
      video.addEventListener('loadedmetadata', attemptAutoplay, { once: true });
      video.addEventListener('canplay', attemptAutoplay, { once: true });

      // CRITICAL: Attempt immediately if video is already ready (videos 3+, or revisiting videos 1-2)
      // This handles the case where the video was previously loaded/paused and autoplay becomes true again
      if (video.readyState >= 1) {
        safePlay(video);
      }

      return () => {
        video.removeEventListener('loadedmetadata', attemptAutoplay);
        video.removeEventListener('canplay', attemptAutoplay);
      };
    }, [autoplay, managedByMediaRuntime, hlsUrl, cloudflareUid, uniqueMediaId]);

    // ============ Pause when autoplay becomes false ============
    // When user scrolls away, pause the video to prevent background audio
    useEffect(() => {
      const video = videoRef.current;
      if (!video || managedByMediaRuntime) return;
      
      if (!autoplay && !video.paused) {
        video.pause();
      }
    }, [autoplay, managedByMediaRuntime]);

    // ============ Decoder Priority Update ============
    // Update decoder slot priority when play state changes
    useEffect(() => {
      if (autoplay) {
        DecoderLimitManager.updatePriority(uniqueMediaId, 'playing');
      } else {
        DecoderLimitManager.updatePriority(uniqueMediaId, 'visible');
      }
    }, [autoplay, uniqueMediaId]);

    // ============ Click Handler ============
    const handleContainerClick = useCallback(() => {
      onClick?.();
      
      if (!controls && showPlayButton) {
        const video = videoRef.current;
        if (video) {
          if (video.paused) {
            safePlay(video);
          } else {
            video.pause();
          }
        }
      }
    }, [onClick, controls, showPlayButton]);

    // ============ Retry Handler ============
    const handleRetry = useCallback(() => {
      setError(null);
      updatePlaybackState('loading');
      currentSrcRef.current = null; // Force reload
      
      if (videoRef.current && hlsUrl) {
        videoRef.current.load();
      }
    }, [hlsUrl, updatePlaybackState]);

    // ============ Mute Toggle Handler ============
    // FIX #10: Use audio fade for smooth mute/unmute transitions
    const handleMuteToggle = useCallback(async () => {
      if (videoRef.current) {
        const newMuted = !isMutedState;
        setIsMutedState(newMuted);
        if (newMuted) {
          await fadeOut(videoRef.current);
        } else {
          await fadeIn(videoRef.current, 1);
        }
      }
    }, [isMutedState, fadeIn, fadeOut]);

    // ============ Render ============
    return (
      <div
        ref={containerRef}
        className={cn(
          "relative overflow-hidden bg-black",
          className
        )}
        style={{
          ...aspectRatioStyle,
          ...style,
        }}
        onClick={handleContainerClick}
      >
        {/* Poster/Placeholder - always render, fade out smoothly */}
        {/* FIX #6: Faster crossfade (150ms vs 300ms) with snappier easing for TikTok-level responsiveness */}
        {poster && (
          <div
            className={cn(
              "absolute inset-0 bg-cover bg-center bg-no-repeat z-[1]",
              "transition-opacity duration-150 ease-out",
              hasFirstFrame ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
            style={{ backgroundImage: `url(${poster})` }}
          />
        )}

        {/* Video Element - fade in as poster fades out */}
        {/* FIX #6: Matched 150ms crossfade timing for seamless poster→video transition */}
        <video
          ref={videoRef}
          className={cn(
            "absolute inset-0 w-full h-full",
            objectFit === 'cover' ? 'object-cover' : 'object-contain',
            "transition-opacity duration-150 ease-out",
            hasFirstFrame ? "opacity-100" : "opacity-0"
          )}
          playsInline
          webkit-playsinline="true"
          muted={isMutedState}
          loop={loop}
          preload={preload}
        />

        {/* Overlay (loading, error, play button, buffering) */}
        <VideoOverlay
          playbackState={playbackState}
          error={error}
          showPlayButton={showPlayButton && !controls}
          showQualityBadge={showQualityBadge}
          quality={quality}
          showBuffering={showBuffering}
          onPlayClick={() => {
            if (videoRef.current) {
              safePlay(videoRef.current);
            }
          }}
          onRetryClick={handleRetry}
        />

        {/* Mute Button */}
        {showMuteButton && !controls && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleMuteToggle();
            }}
            className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors z-10"
            aria-label={isMutedState ? 'Unmute' : 'Mute'}
          >
            {isMutedState ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        )}

        {/* Controls Bar */}
        {controls && (
          <VideoControls
            isPlaying={playbackState === 'playing'}
            isMuted={isMutedState}
            currentTime={currentTime}
            duration={duration}
            onPlayPause={() => {
              const video = videoRef.current;
              if (video) {
                if (video.paused) {
                  safePlay(video);
                } else {
                  video.pause();
                }
              }
            }}
            onMuteToggle={handleMuteToggle}
          />
        )}

        {/* Scrubber */}
        {scrubber && (
          <VideoScrubber
            videoEl={videoRef.current}
            mediaId={uniqueMediaId}
            bufferedPct={bufferedPct}
            isBuffering={isBuffering}
            hasFirstFrame={hasFirstFrame}
            isAttached={isAttachedRef.current}
          />
        )}
      </div>
    );
  }
);

UnifiedVideoPlayerInner.displayName = 'UnifiedVideoPlayer';

// Wrap with React.memo to prevent unnecessary re-renders from parent state changes
export const UnifiedVideoPlayer = React.memo(UnifiedVideoPlayerInner);

export default UnifiedVideoPlayer;
