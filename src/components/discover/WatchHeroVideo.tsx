/**
 * WatchHeroVideo - Hero video card for Watch tab
 * 
 * CLUBHOUSE-PARITY IMPLEMENTATION:
 * - UnifiedVideoPlayer with managedByMediaRuntime=true
 * - surface="hero" for correct priority/telemetry
 * - Skeleton overlay stays until video plays (100ms buffer + 150ms crossfade)
 * - 50%/10% hysteresis autoplay via IntersectionObserver
 * - Poster preload with fetchPriority="high"
 * - Visual error state with retry
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart, RefreshCw } from 'lucide-react';
import { HeroVideo, TrendingPeriod } from '@/hooks/useWatchHeroVideo';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
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
// DEBUG CONFIGURATION
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
// COMPONENT — Clubhouse-Parity Implementation
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
  const readyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // FIX 1: Skeleton-gated playback — skeleton stays until video is playing
  const [isFirstVideoReady, setIsFirstVideoReady] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  // Hysteresis-based autoplay state (50% start, 10% stop)
  const [shouldPlay, setShouldPlay] = useState(false);

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

  // FIX 5: Preload poster image via <link> for fastest possible fetch
  useEffect(() => {
    if (!posterUrl) return;
    
    // Check if preload link already exists
    const existingLink = document.querySelector(`link[href="${posterUrl}"]`);
    if (existingLink) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = posterUrl;
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);

    return () => {
      // Clean up preload link on unmount
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [posterUrl]);

  // Reset ready state when video changes
  useEffect(() => {
    setIsFirstVideoReady(false);
    setHasVideoError(false);
    hasReportedReadyRef.current = false;
    if (readyTimerRef.current) {
      clearTimeout(readyTimerRef.current);
      readyTimerRef.current = null;
    }
  }, [video?.id]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (readyTimerRef.current) {
        clearTimeout(readyTimerRef.current);
      }
    };
  }, []);

  // ============================================================================
  // HYSTERESIS AUTOPLAY — 50% to start, 10% to stop
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
          if (!prev && ratio >= 0.5) {
            logHero('▶️ Hysteresis START', { ratio: ratio.toFixed(2) });
            return true;
          }
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

  // FIX 1: onPlay handler — gate skeleton dismissal with 100ms buffer
  const handlePlay = useCallback(() => {
    const sinceMountMs = performance.now() - mountTimeRef.current;
    logHero('▶️ play', { sinceMountMs: `${sinceMountMs.toFixed(0)}ms` });

    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      // 100ms buffer after play to ensure stability (matches Clubhouse pattern)
      readyTimerRef.current = setTimeout(() => {
        setIsFirstVideoReady(true);
        logHero('✅ isFirstVideoReady = true', { 
          sinceMountMs: `${(performance.now() - mountTimeRef.current).toFixed(0)}ms` 
        });
      }, 100);
    }
  }, []);

  const handleLoadedData = useCallback(() => {
    const sinceMountMs = performance.now() - mountTimeRef.current;
    logHero('📦 loadeddata', { sinceMountMs: `${sinceMountMs.toFixed(0)}ms` });
  }, []);

  const handleCanPlayThrough = useCallback(() => {
    const sinceMountMs = performance.now() - mountTimeRef.current;
    logHero('🎯 canplaythrough', { sinceMountMs: `${sinceMountMs.toFixed(0)}ms` });
  }, []);

  // FIX 4: Error handler with visual state
  const handleError = useCallback((error?: { message?: string }) => {
    const sinceMountMs = performance.now() - mountTimeRef.current;
    logHero('❌ error', { 
      sinceMountMs: `${sinceMountMs.toFixed(0)}ms`,
      error: error?.message || 'Unknown error',
    });
    setHasVideoError(true);
  }, []);

  // FIX 4: Retry handler
  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    logHero('🔄 Retry requested');
    setHasVideoError(false);
    setIsFirstVideoReady(false);
    hasReportedReadyRef.current = false;
    // Force re-mount by toggling a key or re-triggering play
    const player = playerRef.current;
    if (player) {
      player.play();
    }
  }, []);

  // Loading skeleton (data still fetching)
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

  // Empty state
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
        {/* Player — mounts immediately, plays under skeleton */}
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
          surface="hero"
          managedByMediaRuntime={true}
          preload="auto"
          onLoadedData={handleLoadedData}
          onCanPlayThrough={handleCanPlayThrough}
          onPlay={handlePlay}
          onError={handleError}
        />

        {/* FIX 1: Skeleton overlay — stays on top until video is playing */}
        {!isFirstVideoReady && !hasVideoError && (
          <div 
            className="absolute inset-0 z-10 rounded-2xl overflow-hidden transition-opacity duration-150"
            style={{ opacity: isFirstVideoReady ? 0 : 1 }}
          >
            <Skeleton className="w-full h-full rounded-none animate-shimmer-down" />
          </div>
        )}

        {/* FIX 4: Error state overlay */}
        {hasVideoError && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
            {/* Poster fallback background */}
            {posterUrl && (
              <img 
                src={posterUrl} 
                alt="" 
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {!posterUrl && (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-emerald-950" />
            )}
            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/50" />
            {/* Retry button */}
            <button
              onClick={handleRetry}
              className="relative z-20 flex flex-col items-center gap-2 active:scale-95 transition-transform"
            >
              <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <span className="text-white/80 text-xs font-medium">Tap to retry</span>
            </button>
          </div>
        )}

        {/* Gradient Overlay — Bottom 40% */}
        <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black/50 via-black/20 to-transparent pointer-events-none" />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Trending Badge with Like Count — Top Right */}
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

        {/* Bottom Content — Creator Info + Course Name */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {creator && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-white/20" style={{ borderRadius: '34%' }}>
                <img
                  src={creator.profile_photo_url || ''}
                  alt={creator.display_name || 'Creator'}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
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
