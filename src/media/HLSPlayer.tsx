/**
 * HLSPlayer - Unified video player component
 * Single player for all HLS video across grids, cards, and fullscreen
 * 
 * Replaces: GridAutoplayVideo, HLSVideoCard, FlickerFreeHLSPlayer, EnhancedVideoPlayer
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

// ============ Types ============

export interface HLSPlayerProps {
  // Source
  src: string;
  poster?: string;
  
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
  
  // Advanced
  externallyManaged?: boolean; // Disable internal play/pause on click
  startTime?: number; // Resume from position
  preload?: 'none' | 'metadata' | 'auto';
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
}

// ============ Component ============

const HLSPlayer = forwardRef<HLSPlayerRef, HLSPlayerProps>(({
  src,
  poster,
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
  externallyManaged = false,
  startTime,
  preload = 'metadata',
}, ref) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<HlsType | null>(null);
  const mountedRef = useRef(true);
  
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPosterVisible, setIsPosterVisible] = useState(true);
  const [isPosterLoaded, setIsPosterLoaded] = useState(false);
  const [isMutedLocal, setIsMutedLocal] = useState(muted);
  const [hasError, setHasError] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [hasFirstFrame, setHasFirstFrame] = useState(false); // Track first frame readiness
  
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
    attach: () => {
      // Re-attach HLS source if detached - must re-run setupSource
      if (!isAttachedRef.current && videoRef.current && src) {
        isAttachedRef.current = true;
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
  
  // ============ HLS Setup ============
  
  // Ref to hold setupSource function for attach() to call
  const setupSourceRef = useRef<(() => void) | null>(null);
  
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    
    // Skip if detached
    if (!isAttachedRef.current) return;
    
    mountedRef.current = true;
    setHasError(false);
    setIsReady(false);
    setHasFirstFrame(false);
    setIsPosterVisible(true);
    
    const setupSource = async () => {
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
      const canPlayNatively = video.canPlayType('application/vnd.apple.mpegurl') !== '';
      
      if (canPlayNatively || !src.includes('.m3u8')) {
        // Native playback
        video.src = src;
        
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
          maxBufferLength: 6,
          backBufferLength: 4,
          startLevel: -1, // Auto quality
        });
        
        hls.on(Hls.Events.ERROR, (_, data) => {
          console.error('[HLSPlayer] HLS error:', data.type, data.details);
          if (data.fatal) {
            setHasError(true);
            onError?.(new Error(data.details));
          }
        });
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (!mountedRef.current) return;
          
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
          
          if (autoplay) {
            safePlay(video);
          }
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
  }, [src, autoplay, startTime, onError]);
  
  // ============ Event Handlers ============
  
  // Apply WebView attributes and expose ref for prewarm
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.setAttribute('webkit-playsinline', 'true');
      video.setAttribute('x5-playsinline', 'true');
      
      // Expose player ref on element for prewarm observer to call attach/detach
      (video as any).__hlsPlayerRef = {
        attach: () => {
          // Skip if already attached - prevents white flash from unnecessary resets
          if (!isAttachedRef.current) {
            isAttachedRef.current = true;
            setHasFirstFrame(false);
            setIsPosterVisible(true);
            setupSourceRef.current?.();
          }
        },
        detach: () => {
          if (isAttachedRef.current) {
            isAttachedRef.current = false;
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
          }
        }
      };
      
      // Cleanup __hlsPlayerRef on unmount to prevent stale refs
      return () => {
        delete (video as any).__hlsPlayerRef;
      };
    }
  }, []);
  
  const handleLoadedData = useCallback(() => {
    if (!mountedRef.current) return;
    
    setIsReady(true);
    
    // FIX: Mark first frame ready regardless of play state
    // This is the key fix for "no poster jump" - hide poster when frame is ready, not when playing
    const video = videoRef.current;
    if (video && video.readyState >= 2) {
      setHasFirstFrame(true);
      // Crossfade poster out on first frame readiness (not dependent on !paused)
      setTimeout(() => {
        if (mountedRef.current) {
          setIsPosterVisible(false);
        }
      }, 50);
    }
    
    onLoadedData?.();
  }, [onLoadedData]);
  
  const handlePlay = useCallback(() => {
    if (!mountedRef.current) return;
    
    setIsPlaying(true);
    setHasError(false);
    
    // Poster already handled by hasFirstFrame in handleLoadedData
    // This is a backup in case loadeddata wasn't triggered yet
    if (!hasFirstFrame) {
      setTimeout(() => {
        if (mountedRef.current) {
          setIsPosterVisible(false);
        }
      }, 120);
    }
    
    onPlay?.();
  }, [onPlay, hasFirstFrame]);
  
  const handlePause = useCallback(() => {
    if (!mountedRef.current) return;
    
    setIsPlaying(false);
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
  
  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    
    const video = videoRef.current;
    if (!video) return;
    
    setHasError(false);
    
    // Re-trigger source setup by toggling src
    const currentSrc = src;
    video.src = '';
    setTimeout(() => {
      video.src = currentSrc;
      safePlay(video);
    }, 100);
  }, [src]);
  
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
      {/* Poster Layer - crossfades out when video plays */}
      {poster && (
        <img
          src={poster}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full transition-opacity duration-150',
            objectFitClass,
            isPosterVisible && isPosterLoaded ? 'opacity-100 z-10' : 'opacity-0 z-0'
          )}
          onLoad={() => setIsPosterLoaded(true)}
          onError={() => setIsPosterLoaded(false)}
        />
      )}
      
      {/* Video Element - WebView-safe attributes baked in */}
      <video
        ref={videoRef}
        className={cn(
          'w-full h-full transition-opacity duration-150',
          objectFitClass,
          // FIX: Only show video when first frame is ready - prevents white flash
          hasFirstFrame ? 'opacity-100' : 'opacity-0'
        )}
        // Core playback
        muted
        playsInline
        loop={loop}
        preload={preload}
        
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
      
      {/* Error State with Retry */}
      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-black/60">
          <button
            className="flex flex-col items-center gap-2 text-white"
            onClick={handleRetry}
            aria-label="Retry playback"
          >
            <RefreshCw className="w-8 h-8" />
            <span className="text-sm">Tap to retry</span>
          </button>
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
    </div>
  );
});

HLSPlayer.displayName = 'HLSPlayer';

export default memo(HLSPlayer);
