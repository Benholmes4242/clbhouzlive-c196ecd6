/**
 * WatchHeroVideo - Hero video card for Watch tab
 * 
 * Displays the most liked video with:
 * - 16:9 aspect ratio
 * - Trending badge (top right)
 * - Creator info overlay (squircle avatar)
 * - Autoplay on mount (muted)
 * 
 * DEBUG MODE (Jan 2026):
 * - Comprehensive logging for performance analysis
 * - Tracks mount → load → play → canplaythrough timing
 * - MediaRuntime integration diagnostics
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart } from 'lucide-react';
import { HeroVideo, TrendingPeriod } from '@/hooks/useWatchHeroVideo';
import { getStreamPoster } from '@/utils/stream';
import { HLSPlayer, HLSPlayerRef } from '@/media';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { MediaRuntime } from '@/media/runtime/MediaRuntime';
import { extractCloudflareUid, shortUid } from '@/utils/videoIdUtils';
import { 
  DEBUG_WATCH, 
  logWatch, 
} from './debug';

// ============================================================================
// DEBUG CONFIGURATION - Uses centralized debug system
// ============================================================================
const DEBUG_HERO = DEBUG_WATCH; // Inherits from Watch tab debug flag

const logHero = (event: string, data?: Record<string, unknown>) => {
  if (!DEBUG_HERO) return;
  logWatch('media', 'WatchHeroVideo', event, data);
};

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================
interface WatchHeroVideoProps {
  video: HeroVideo | null;
  trendingPeriod: TrendingPeriod;
  isLoading: boolean;
  onTap: () => void;
}

const BADGE_TEXT: Record<TrendingPeriod, string> = {
  today: 'TRENDING TODAY',
  this_week: 'TRENDING THIS WEEK',
  this_month: 'TRENDING THIS MONTH',
  all_time: 'TOP VIDEO',
};

// ============================================================================
// COMPONENT
// ============================================================================
export function WatchHeroVideo({ 
  video, 
  trendingPeriod, 
  isLoading, 
  onTap 
}: WatchHeroVideoProps) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const mountTimeRef = useRef<number>(performance.now());
  const hasRegisteredRef = useRef(false);
  const hasRequestedPlayRef = useRef(false);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  
  // Timing tracking
  const [timings, setTimings] = useState<{
    loadStart?: number;
    loadedMetadata?: number;
    canPlay?: number;
    canPlayThrough?: number;
    firstPlay?: number;
    error?: string;
  }>({});

  // Extract stream ID for MediaRuntime
  const streamId = video?.media?.[0]?.media_url 
    ? (extractCloudflareUid(video.media[0].media_url) || video.id)
    : null;

  // Log mount
  useEffect(() => {
    mountTimeRef.current = performance.now();
    hasRegisteredRef.current = false;
    hasRequestedPlayRef.current = false;
    setTimings({});
    
    logHero('🎬 MOUNTED', {
      videoId: video?.id?.slice(0, 8),
      streamId: streamId ? shortUid(streamId) : null,
      trendingPeriod,
      isLoading,
      hasVideo: !!video,
      mediaCount: video?.media?.length ?? 0,
    });

    return () => {
      logHero('🔴 UNMOUNTED', {
        videoId: video?.id?.slice(0, 8),
        streamId: streamId ? shortUid(streamId) : null,
        totalMountDuration: `${(performance.now() - mountTimeRef.current).toFixed(0)}ms`,
      });
      
      // Unregister from MediaRuntime
      if (streamId && hasRegisteredRef.current) {
        MediaRuntime.unregisterMedia(streamId);
        hasRegisteredRef.current = false;
      }
    };
  }, [video?.id, streamId, trendingPeriod, isLoading]);

  // Attach native video element event listeners for detailed debugging
  useEffect(() => {
    if (!DEBUG_HERO) return;
    
    // Poll for video element availability
    const checkForVideoElement = () => {
      const videoEl = playerRef.current?.getElement();
      if (videoEl && videoEl !== videoElementRef.current) {
        videoElementRef.current = videoEl;
        attachDebugListeners(videoEl);
      }
    };
    
    const intervalId = setInterval(checkForVideoElement, 100);
    const timeoutId = setTimeout(() => clearInterval(intervalId), 5000);
    
    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      if (videoElementRef.current) {
        detachDebugListeners(videoElementRef.current);
        videoElementRef.current = null;
      }
    };
  }, [streamId]);

  // Debug listener attachment
  const attachDebugListeners = (videoEl: HTMLVideoElement) => {
    const logEvent = (eventName: string) => () => {
      const now = performance.now();
      const sinceMountMs = now - mountTimeRef.current;
      
      const eventData: Record<string, unknown> = {
        streamId: streamId ? shortUid(streamId) : null,
        sinceMountMs: `${sinceMountMs.toFixed(0)}ms`,
        readyState: videoEl.readyState,
        networkState: videoEl.networkState,
        currentTime: videoEl.currentTime?.toFixed(2),
        paused: videoEl.paused,
      };
      
      if (eventName === 'loadedmetadata') {
        eventData.duration = videoEl.duration?.toFixed(1);
        eventData.videoWidth = videoEl.videoWidth;
        eventData.videoHeight = videoEl.videoHeight;
        setTimings(prev => ({ ...prev, loadedMetadata: sinceMountMs }));
      } else if (eventName === 'loadstart') {
        setTimings(prev => ({ ...prev, loadStart: sinceMountMs }));
      } else if (eventName === 'canplay') {
        eventData.buffered = videoEl.buffered?.length ? `${videoEl.buffered.end(0).toFixed(1)}s` : '0s';
        setTimings(prev => ({ ...prev, canPlay: sinceMountMs }));
      } else if (eventName === 'canplaythrough') {
        eventData.buffered = videoEl.buffered?.length ? `${videoEl.buffered.end(0).toFixed(1)}s` : '0s';
        setTimings(prev => ({ ...prev, canPlayThrough: sinceMountMs }));
      } else if (eventName === 'play') {
        setTimings(prev => ({ ...prev, firstPlay: prev.firstPlay ?? sinceMountMs }));
        eventData.TTFF = `${sinceMountMs.toFixed(0)}ms`;
      } else if (eventName === 'waiting' || eventName === 'stalled') {
        eventData.buffered = videoEl.buffered?.length ? `${videoEl.buffered.end(0).toFixed(1)}s` : '0s';
      } else if (eventName === 'error') {
        eventData.errorCode = videoEl.error?.code;
        eventData.errorMessage = videoEl.error?.message;
        setTimings(prev => ({ ...prev, error: videoEl.error?.message || 'Unknown error' }));
      }
      
      const emoji = {
        loadstart: '📥',
        loadedmetadata: '📋',
        loadeddata: '📦',
        canplay: '✅',
        canplaythrough: '🎯',
        play: '▶️',
        playing: '🎬',
        pause: '⏸️',
        waiting: '⏳',
        stalled: '🚫',
        error: '❌',
        seeking: '🔍',
        seeked: '📍',
        ended: '🏁',
        timeupdate: '⏱️',
      }[eventName] || '📌';
      
      // Skip frequent timeupdate events
      if (eventName === 'timeupdate') return;
      
      logHero(`${emoji} ${eventName}`, eventData);
    };

    const events = [
      'loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough',
      'play', 'playing', 'pause', 'waiting', 'stalled', 'error',
      'seeking', 'seeked', 'ended'
    ];
    
    events.forEach(event => {
      videoEl.addEventListener(event, logEvent(event));
    });

    logHero('🔌 Debug listeners attached', {
      src: videoEl.currentSrc?.slice(0, 60) || videoEl.src?.slice(0, 60),
      readyState: videoEl.readyState,
      networkState: videoEl.networkState,
    });
  };

  const detachDebugListeners = (videoEl: HTMLVideoElement) => {
    // Note: We can't easily remove the listeners since we created inline functions
    // This is fine for debugging purposes - the element will be garbage collected
    logHero('🔌 Debug listeners will be cleaned up with element');
  };

  // Register with MediaRuntime when video is loaded
  const handleLoadedData = useCallback(() => {
    if (!streamId || !playerRef.current || hasRegisteredRef.current) return;
    
    const videoEl = playerRef.current.getElement();
    if (!videoEl) {
      logHero('⚠️ Video element not available for registration');
      return;
    }

    const now = performance.now();
    const sinceMountMs = now - mountTimeRef.current;
    
    logHero('📝 Registering with MediaRuntime', {
      streamId: shortUid(streamId),
      sinceMountMs: `${sinceMountMs.toFixed(0)}ms`,
      videoReadyState: videoEl.readyState,
      videoNetworkState: videoEl.networkState,
      videoPaused: videoEl.paused,
      videoMuted: videoEl.muted,
    });

    MediaRuntime.registerMedia({
      id: streamId,
      element: videoEl,
      surface: 'hero',
      sortIndex: -1, // Hero always has priority
      observeTarget: videoEl.parentElement || videoEl,
    });
    
    hasRegisteredRef.current = true;

    // Request play after short delay
    setTimeout(() => {
      if (!hasRequestedPlayRef.current && streamId) {
        hasRequestedPlayRef.current = true;
        
        logHero('▶️ Requesting play via MediaRuntime', {
          streamId: shortUid(streamId),
          sinceMountMs: `${(performance.now() - mountTimeRef.current).toFixed(0)}ms`,
        });
        
        MediaRuntime.setCandidateState(streamId, { visible: true, ratio: 1 });
        MediaRuntime.requestPlay({
          id: streamId,
          surface: 'hero',
          reason: 'autoplay',
        });
      }
    }, 50);
  }, [streamId]);

  const handleCanPlayThrough = useCallback(() => {
    const now = performance.now();
    const sinceMountMs = now - mountTimeRef.current;
    
    logHero('🎯 HLSPlayer canplaythrough callback', {
      streamId: streamId ? shortUid(streamId) : null,
      sinceMountMs: `${sinceMountMs.toFixed(0)}ms`,
    });
  }, [streamId]);

  const handlePlay = useCallback(() => {
    const now = performance.now();
    const sinceMountMs = now - mountTimeRef.current;
    
    logHero('🎬 HLSPlayer play callback', {
      streamId: streamId ? shortUid(streamId) : null,
      sinceMountMs: `${sinceMountMs.toFixed(0)}ms`,
    });
  }, [streamId]);

  const handleError = useCallback((error?: Error) => {
    const now = performance.now();
    const sinceMountMs = now - mountTimeRef.current;
    
    logHero('❌ HLSPlayer error callback', {
      streamId: streamId ? shortUid(streamId) : null,
      sinceMountMs: `${sinceMountMs.toFixed(0)}ms`,
      error: error?.message || 'Unknown error',
    });
    
    setTimings(prev => ({ ...prev, error: error?.message || 'Unknown error' }));
  }, [streamId]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="pt-2">
        <Skeleton className="w-full aspect-[3/2]" />
        <div className="flex items-center gap-2.5 mt-3 px-4">
          <Skeleton className="w-9 h-10 rounded-[34%]" />
          <div className="space-y-1.5">
            <Skeleton className="w-24 h-4 rounded" />
            <Skeleton className="w-16 h-3 rounded" />
          </div>
        </div>
      </div>
    );
  }

  // Empty state - No video available
  if (!video || video.media.length === 0) {
    logHero('📭 Empty state - no video available');
    return (
      <div className="pt-2">
        <div className="w-full aspect-[3/2] bg-gradient-to-br from-muted/50 to-muted flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-background/80 flex items-center justify-center mb-3 shadow-sm">
            <Heart className="w-7 h-7 text-muted-foreground" />
          </div>
          <p className="text-foreground font-semibold">No trending videos yet</p>
          <p className="text-muted-foreground text-sm">Be the first to post!</p>
        </div>
      </div>
    );
  }

  const primaryMedia = video.media[0];
  const mediaUrl = primaryMedia.media_url;
  const posterUrl = primaryMedia.poster_url || getStreamPoster(mediaUrl, '1s') || undefined;
  const creator = video.creator;

  return (
    <div className="pt-2">
      <div 
        className="relative w-full aspect-[3/2] overflow-hidden cursor-pointer group bg-muted"
        onClick={onTap}
      >
        {/* Video Player */}
        <HLSPlayer
          ref={playerRef}
          src={mediaUrl}
          posterUrl={posterUrl}
          autoplay={false}
          muted
          loop
          objectFit="cover"
          className="absolute inset-0 w-full h-full"
          mediaId={streamId || undefined}
          managedByMediaRuntime={true}
          onLoadedData={handleLoadedData}
          onCanPlayThrough={handleCanPlayThrough}
          onPlay={handlePlay}
          onError={handleError}
        />


        {/* Hover overlay */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Trending Badge - Top Right - Explore tab glass style */}
        <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-md bg-black/35 border border-white/10 rounded-full">
          <span className="text-white text-xs font-semibold tracking-wide">
            {BADGE_TEXT[trendingPeriod]}
          </span>
          <span className="text-white/80">🔥</span>
        </div>


        {/* Bottom Content - Creator Info Only (no caption) */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {/* Creator Info with Squircle Avatar */}
          {creator && (
            <div className="flex items-center gap-2.5">
              <SquircleAvatar
                size={36}
                src={creator.profile_photo_url}
                alt={creator.display_name || 'Creator'}
                fallback={(creator.display_name || 'G').charAt(0).toUpperCase()}
                hideRing
              />
              <p className="text-white text-sm font-semibold truncate min-w-0">
                {creator.display_name || 'Golfer'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WatchHeroVideo;