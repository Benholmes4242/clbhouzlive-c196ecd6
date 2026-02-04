/**
 * WatchHeroVideo - Hero video card for Watch tab
 * 
 * TIKTOK-LEVEL IMPLEMENTATION:
 * - Direct UnifiedVideoPlayer (no legacy wrapper)
 * - 50%/10% hysteresis autoplay via IntersectionObserver
 * - Priority poster loading with fetchPriority="high"
 * - 150ms crossfade poster→video transition
 * - Shimmer-down skeleton animation
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart } from 'lucide-react';
import { HeroVideo, TrendingPeriod } from '@/hooks/useWatchHeroVideo';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { extractCloudflareUid, shortUid } from '@/utils/videoIdUtils';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { isPosterFailed } from '@/utils/posterPrefetch';
import { FLAGS } from '@/config/flags';

// ============================================================================
// DEBUG CONFIGURATION - Controlled by unified CLUBHOUSE_DEBUG flag
// ============================================================================
const DEBUG_HERO = FLAGS.CLUBHOUSE_DEBUG;

const logHero = (event: string, data?: Record<string, unknown>) => {
  if (!DEBUG_HERO) return;
  console.log(`[WatchHeroVideo] ${event}`, data || '');
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
// COMPONENT - TikTok-Level Implementation
// ============================================================================
export function WatchHeroVideo({ 
  video, 
  trendingPeriod, 
  isLoading, 
  onTap 
}: WatchHeroVideoProps) {
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mountTimeRef = useRef<number>(performance.now());
  const hasReportedReadyRef = useRef(false);
  const [hasFirstFrame, setHasFirstFrame] = useState(false);
  
  // P0: Hysteresis-based autoplay state (50% start, 10% stop)
  const [shouldPlay, setShouldPlay] = useState(false);
  
  // Timing tracking for debug
  const [timings, setTimings] = useState<{
    loadStart?: number;
    loadedMetadata?: number;
    canPlay?: number;
    canPlayThrough?: number;
    firstPlay?: number;
    error?: string;
  }>({});

  // Extract stream ID
  const streamId = video?.media?.[0]?.media_url 
    ? (extractCloudflareUid(video.media[0].media_url) || video.id)
    : null;

  // Generate HLS URL
  const hlsUrl = streamId ? generateStreamHlsUrl(streamId) : null;
  
  // Generate poster URL with fallback handling
  const generatedPosterUrl = streamId 
    ? generateStreamThumbnailUrl(streamId, { height: 800, fit: 'cover' }) 
    : undefined;
  const posterUrl = generatedPosterUrl && !isPosterFailed(generatedPosterUrl) 
    ? generatedPosterUrl 
    : undefined;

  // ============================================================================
  // P0: HYSTERESIS AUTOPLAY - 50% to start, 10% to stop
  // ============================================================================
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !hlsUrl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        
        const ratio = entry.intersectionRatio;
        
        setShouldPlay(prev => {
          // Start playing at 50% visibility
          if (!prev && ratio >= 0.5) {
            logHero('▶️ Hysteresis START', { ratio: ratio.toFixed(2) });
            return true;
          }
          // Stop playing when below 10% visibility
          if (prev && ratio < 0.1) {
            logHero('⏸️ Hysteresis STOP', { ratio: ratio.toFixed(2) });
            return false;
          }
          return prev;
        });
      },
      {
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
        rootMargin: '0px',
      }
    );

    observer.observe(container);
    
    return () => {
      observer.disconnect();
    };
  }, [hlsUrl]);

  // Control playback based on hysteresis state
  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    if (shouldPlay) {
      player.play();
    } else {
      player.pause();
    }
  }, [shouldPlay]);

  // Log mount/unmount
  useEffect(() => {
    mountTimeRef.current = performance.now();
    hasReportedReadyRef.current = false;
    setHasFirstFrame(false);
    setTimings({});
    
    logHero('🎬 MOUNTED', {
      videoId: video?.id?.slice(0, 8),
      streamId: streamId ? shortUid(streamId) : null,
      trendingPeriod,
      isLoading,
      hasVideo: !!video,
    });

    return () => {
      logHero('🔴 UNMOUNTED', {
        videoId: video?.id?.slice(0, 8),
        streamId: streamId ? shortUid(streamId) : null,
        totalMountDuration: `${(performance.now() - mountTimeRef.current).toFixed(0)}ms`,
      });
    };
  }, [video?.id, streamId, trendingPeriod, isLoading]);

  // Handle loadeddata for first frame
  const handleLoadedData = useCallback(() => {
    setHasFirstFrame(true);
    const sinceMountMs = performance.now() - mountTimeRef.current;
    setTimings(prev => ({ ...prev, loadedMetadata: sinceMountMs }));
    logHero('📦 loadeddata', { sinceMountMs: `${sinceMountMs.toFixed(0)}ms` });
  }, []);

  // Handle canplaythrough for buffered ready state
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      const sinceMountMs = performance.now() - mountTimeRef.current;
      setTimings(prev => ({ ...prev, canPlayThrough: sinceMountMs }));
      logHero('🎯 canplaythrough', { sinceMountMs: `${sinceMountMs.toFixed(0)}ms` });
    }
  }, []);

  const handlePlay = useCallback(() => {
    const sinceMountMs = performance.now() - mountTimeRef.current;
    setTimings(prev => ({ ...prev, firstPlay: prev.firstPlay ?? sinceMountMs }));
    logHero('▶️ play', { sinceMountMs: `${sinceMountMs.toFixed(0)}ms` });
  }, []);

  const handleError = useCallback((error?: { message?: string }) => {
    const sinceMountMs = performance.now() - mountTimeRef.current;
    logHero('❌ error', { 
      sinceMountMs: `${sinceMountMs.toFixed(0)}ms`,
      error: error?.message || 'Unknown error',
    });
    setTimings(prev => ({ ...prev, error: error?.message || 'Unknown error' }));
  }, []);

  // P2: Enhanced shimmer-down skeleton
  if (isLoading) {
    return (
      <div className="pt-2">
        <Skeleton className="w-full aspect-[3/2] animate-shimmer-down" />
        <div className="flex items-center gap-2.5 mt-3 px-4">
          <Skeleton className="w-9 h-10 rounded-[34%] animate-shimmer-down" style={{ animationDelay: '50ms' }} />
          <div className="space-y-1.5">
            <Skeleton className="w-24 h-4 rounded animate-shimmer-down" style={{ animationDelay: '100ms' }} />
            <Skeleton className="w-16 h-3 rounded animate-shimmer-down" style={{ animationDelay: '150ms' }} />
          </div>
        </div>
      </div>
    );
  }

  // Empty state - No video available
  if (!video || video.media.length === 0 || !hlsUrl) {
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

  const creator = video.creator;

  return (
    <div className="pt-2">
      <div 
        ref={containerRef}
        className="relative w-full aspect-[3/2] overflow-hidden cursor-pointer group bg-black"
        onClick={onTap}
      >
        {/* P1: Priority Poster with fetchPriority="high" */}
        {posterUrl && !hasFirstFrame && (
          <img
            src={posterUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover z-10 transition-opacity duration-150 ease-out"
            style={{ opacity: hasFirstFrame ? 0 : 1 }}
            fetchPriority="high"
            loading="eager"
            decoding="async"
          />
        )}

        {/* Video Player - DIRECT UnifiedVideoPlayer (P0) */}
        <UnifiedVideoPlayer
          ref={playerRef}
          src={hlsUrl}
          posterUrl={posterUrl}
          // P0: Controlled autoplay via hysteresis (not autoplay prop)
          autoplay={false}
          muted
          loop
          showMuteButton={false}
          showPlayButton={false}
          scrubber={false}
          objectFit="cover"
          className="absolute inset-0 w-full h-full"
          mediaId={streamId || undefined}
          surface="grid"
          managedByMediaRuntime={false}
          preload="auto"
          onLoadedData={handleLoadedData}
          onCanPlayThrough={handleCanPlayThrough}
          onPlay={handlePlay}
          onError={handleError}
        />

        {/* P1: 150ms crossfade overlay - fades out when first frame ready */}
        <div 
          className={`absolute inset-0 bg-black/5 pointer-events-none transition-opacity duration-150 ease-out ${hasFirstFrame ? 'opacity-0' : 'opacity-100'}`}
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Trending Badge - Top Right - Explore tab glass style */}
        <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-md bg-black/35 border border-white/10 rounded-full">
          <span className="text-white text-xs font-semibold tracking-wide">
            {BADGE_TEXT[trendingPeriod]}
          </span>
          <span className="text-white/80">🔥</span>
        </div>

        {/* Debug Overlay - Only in debug mode */}
        {DEBUG_HERO && (
          <div className="absolute top-3 left-3 bg-black/70 text-white text-[10px] font-mono px-2 py-1 rounded max-w-[200px] pointer-events-none z-50">
            <div>ID: {streamId ? shortUid(streamId) : 'N/A'}</div>
            <div>Play: {shouldPlay ? '▶️' : '⏸️'}</div>
            <div>Meta: {timings.loadedMetadata ? `${timings.loadedMetadata.toFixed(0)}ms` : '—'}</div>
            <div>CanPlay: {timings.canPlayThrough ? `${timings.canPlayThrough.toFixed(0)}ms` : '—'}</div>
            <div>TTFF: {timings.firstPlay ? `${timings.firstPlay.toFixed(0)}ms` : '—'}</div>
            {timings.error && <div className="text-red-400">ERR: {timings.error.slice(0, 20)}</div>}
          </div>
        )}

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
