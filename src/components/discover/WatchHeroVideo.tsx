/**
 * WatchHeroVideo - Hero video card for Watch tab
 * 
 * UNIFIED WITH CLUBHOUSE: Uses the exact same video wiring pattern as
 * ClubhouseVerticalGrid's VideoWithAutoplay component for consistent
 * autoplay behavior across all surfaces.
 * 
 * Key patterns (matching Clubhouse):
 * - managedByMediaRuntime={false} - No external runtime control
 * - autoplay={true} with muted - Direct browser autoplay
 * - preload="auto" - Buffer ahead for instant playback
 * - No manual MediaRuntime registration
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Heart } from 'lucide-react';
import { HeroVideo, TrendingPeriod } from '@/hooks/useWatchHeroVideo';
import { getStreamPoster } from '@/utils/stream';
import { HLSPlayer, HLSPlayerRef } from '@/media';
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
// COMPONENT - Unified with Clubhouse VideoWithAutoplay pattern
// ============================================================================
export function WatchHeroVideo({ 
  video, 
  trendingPeriod, 
  isLoading, 
  onTap 
}: WatchHeroVideoProps) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const mountTimeRef = useRef<number>(performance.now());
  const hasReportedReadyRef = useRef(false);
  const [hasFirstFrame, setHasFirstFrame] = useState(false);
  
  // Timing tracking for debug
  const [timings, setTimings] = useState<{
    loadStart?: number;
    loadedMetadata?: number;
    canPlay?: number;
    canPlayThrough?: number;
    firstPlay?: number;
    error?: string;
  }>({});

  // Extract stream ID using the same pattern as Clubhouse
  const streamId = video?.media?.[0]?.media_url 
    ? (extractCloudflareUid(video.media[0].media_url) || video.id)
    : null;

  // Generate HLS URL using the same utility as Clubhouse
  const hlsUrl = streamId ? generateStreamHlsUrl(streamId) : null;
  
  // Generate poster URL with fallback handling (same as Clubhouse)
  const generatedPosterUrl = streamId 
    ? generateStreamThumbnailUrl(streamId, { height: 800, fit: 'cover' }) 
    : undefined;
  const posterUrl = generatedPosterUrl && !isPosterFailed(generatedPosterUrl) 
    ? generatedPosterUrl 
    : undefined;

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

  // INSTANT VIDEO: Use loadeddata for first frame (faster than canplaythrough)
  // Matches Clubhouse VideoWithAutoplay pattern exactly
  const handleLoadedData = useCallback(() => {
    setHasFirstFrame(true);
    const sinceMountMs = performance.now() - mountTimeRef.current;
    setTimings(prev => ({ ...prev, loadedMetadata: sinceMountMs }));
    logHero('📦 loadeddata', { sinceMountMs: `${sinceMountMs.toFixed(0)}ms` });
  }, []);

  // INSTANT VIDEO: Use canplaythrough for buffered ready state
  // Matches Clubhouse VideoWithAutoplay pattern exactly
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

  const handleError = useCallback((error?: Error) => {
    const sinceMountMs = performance.now() - mountTimeRef.current;
    logHero('❌ error', { 
      sinceMountMs: `${sinceMountMs.toFixed(0)}ms`,
      error: error?.message || 'Unknown error',
    });
    setTimings(prev => ({ ...prev, error: error?.message || 'Unknown error' }));
  }, []);

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
        className="relative w-full aspect-[3/2] overflow-hidden cursor-pointer group bg-black"
        onClick={onTap}
      >
        {/* Video Player - UNIFIED WITH CLUBHOUSE PATTERN */}
        <HLSPlayer
          ref={playerRef}
          src={hlsUrl}
          posterUrl={posterUrl}
          // CRITICAL: Match Clubhouse pattern exactly
          autoplay={true}
          muted
          loop
          showMuteButton={false}
          showPlayButton={false}
          showScrubber={false}
          objectFit="cover"
          className="absolute inset-0 w-full h-full"
          mediaId={streamId || undefined}
          // CRITICAL: managedByMediaRuntime=false matches Clubhouse
          managedByMediaRuntime={false}
          externallyManaged={false}
          // CRITICAL: preload="auto" for instant buffering (matches Clubhouse)
          preload="auto"
          onLoadedData={handleLoadedData}
          onCanPlayThrough={handleCanPlayThrough}
          onPlay={handlePlay}
          onError={handleError}
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