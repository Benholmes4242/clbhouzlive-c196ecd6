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

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

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
  // Paused-video pattern: no external hasFirstFrame state needed
  // UnifiedVideoPlayer handles poster→video transition internally
  
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

  // Handle loadeddata - timing only, no external state needed
  const handleLoadedData = useCallback(() => {
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
      <div className="pt-3 px-4">
        <Skeleton className="w-full aspect-square rounded-2xl animate-shimmer-down" />
        <div className="flex items-center gap-2.5 mt-3 px-1">
          <Skeleton className="w-9 h-9 rounded-full animate-shimmer-down" style={{ animationDelay: '50ms' }} />
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
      <div className="pt-3 px-4">
        <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-muted/50 to-muted flex flex-col items-center justify-center">
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
  const courseName = video.course?.name || null;

  return (
    <div className="pt-3 px-4">
      <div 
        ref={containerRef}
        className="relative w-full aspect-square rounded-2xl overflow-hidden cursor-pointer group bg-black shadow-sm"
        onClick={onTap}
      >
        <UnifiedVideoPlayer
          ref={playerRef}
          src={hlsUrl}
          posterUrl={posterUrl}
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

        {/* Gradient Overlay - Bottom 40% */}
        <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Trending Badge with Like Count - Top Right */}
        <div className="absolute top-3 right-3 inline-flex items-center gap-1.5 px-3 py-1.5 backdrop-blur-sm bg-black/40 rounded-full">
          <span className="text-white/90 text-sm leading-none">🔥</span>
          <span className="text-white text-xs font-medium">
            {BADGE_TEXT[trendingPeriod]}
          </span>
          {video.like_count > 0 && (
            <>
              <span className="text-white/40">·</span>
              <span className="text-white/80 text-xs font-medium">{formatCount(video.like_count)} {video.like_count === 1 ? 'like' : 'likes'}</span>
            </>
          )}
        </div>

        {/* Bottom Content - Creator Info + Course Name */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {creator && (
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={creator.profile_photo_url || ''}
                alt={creator.display_name || 'Creator'}
                className="w-9 h-9 rounded-full object-cover bg-white/20 flex-shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
              <div className="flex flex-col min-w-0">
                <p className="text-white text-base font-semibold truncate">
                  {creator.display_name || creator.username || ''}
                </p>
                {courseName && (
                  <p className="text-white/70 text-xs truncate">{courseName}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default WatchHeroVideo;