/**
 * LongFormVideoTileAutoplay - Video tile with visibility-based autoplay
 * 
 * CLUBHOUSE PARITY: Uses MediaRuntime registration, play-gated transitions,
 * shimmer overlays, and error recovery matching the Clubhouse gold standard.
 */

import React, { useRef, useMemo, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Play, Flame, Heart, RotateCw } from 'lucide-react';
import { VideoQueueMenu } from './VideoQueueMenu';
import { GolferAvatar } from '@/components/golfers/GolferAvatar';
import { UnifiedVideoPlayer, runtimeUserTap } from '@/media';
import { formatDistanceToNow } from 'date-fns';
import type { QueueItemMeta } from '@/hooks/useVideoQueue';
import type { LongFormVideo } from './LongFormVideoTile';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { isPosterFailed } from '@/utils/posterPrefetch';

// Re-export for convenience
export type { LongFormVideo };

interface LongFormVideoTileAutoplayProps {
  video: LongFormVideo;
  onVideoClick?: (id: string) => void;
  onCreatorClick?: (creatorUserId: string) => void;
  onPlayNext?: (id: string, meta?: QueueItemMeta) => void;
  onEnqueue?: (id: string, meta?: QueueItemMeta) => void;
  className?: string;
  /** Index in list - first 6 get priority loading */
  index?: number;
}

/**
 * LongFormVideoTileAutoplay - Video tile with Clubhouse-grade playback
 * MediaRuntime registered, play-gated transitions, shimmer + error recovery
 */
export const LongFormVideoTileAutoplay: React.FC<LongFormVideoTileAutoplayProps> = ({
  video,
  onVideoClick,
  onCreatorClick,
  onPlayNext,
  onEnqueue,
  className,
  index = 0,
}) => {
  const tileRef = useRef<HTMLDivElement>(null);
  const [shouldPlay, setShouldPlay] = useState(false);
  
  // Transition states: shimmer → poster fade-in → play-gated video reveal
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const isVideoReadyTimerRef = useRef<ReturnType<typeof setTimeout>>();
  
  // P0: TikTok-level 50% start / 10% stop hysteresis autoplay
  useEffect(() => {
    const element = tileRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const ratio = entries[0]?.intersectionRatio ?? 0;
        setShouldPlay(prev => {
          if (!prev && ratio >= 0.5) return true;
          if (prev && ratio < 0.1) return false;
          return prev;
        });
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const hasVideo = !!video.mediaUrl;
  const isPriority = index < 6;

  // Extract stream UID for cache consistency
  const streamId = useMemo(() => {
    return uidFromNode({ src: video.mediaUrl }) || video.id;
  }, [video.mediaUrl, video.id]);

  // Generate HLS URL and poster URL
  const hlsUrl = streamId ? generateStreamHlsUrl(streamId) : null;
  const generatedPosterUrl = streamId ? generateStreamThumbnailUrl(streamId, { height: 720, fit: 'cover' }) : undefined;
  const posterUrl = generatedPosterUrl && !isPosterFailed(generatedPosterUrl) ? generatedPosterUrl : video.thumbnailUrl;

  // Reset states when video changes
  useEffect(() => {
    setPosterLoaded(false);
    setIsVideoReady(false);
    setHasError(false);
    return () => {
      if (isVideoReadyTimerRef.current) clearTimeout(isVideoReadyTimerRef.current);
    };
  }, [video.id]);

  // Play-gated transition with 100ms buffer
  const handlePlay = useCallback(() => {
    if (isVideoReadyTimerRef.current) clearTimeout(isVideoReadyTimerRef.current);
    isVideoReadyTimerRef.current = setTimeout(() => {
      setIsVideoReady(true);
    }, 100);
  }, []);

  // Error handler with retry
  const handleError = useCallback(() => {
    setHasError(true);
    setIsVideoReady(false);
  }, []);

  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsVideoReady(false);
    setRetryKey(k => k + 1);
  }, []);

  // Whether the video layer is ready to show (play-gated)
  const videoIsReady = isVideoReady && shouldPlay && !hasError;

  const formatLikes = (count?: number): string => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCreatorClick?.(video.creatorUserId);
  };

  return (
    <div
      ref={tileRef}
      className={cn(
        "group cursor-pointer bg-card overflow-hidden",
        className
      )}
      onClick={() => {
        runtimeUserTap(video.id);
        onVideoClick?.(video.id);
      }}
    >
      {/* Media Section - 16:9 aspect ratio with GPU acceleration */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted will-change-transform">
        {/* Shimmer overlay (base layer) */}
        <div className="absolute inset-0 bg-gray-100 overflow-hidden z-0">
          <div className="h-full w-full -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-gray-200/60 to-transparent motion-reduce:animate-none" />
        </div>

        {/* Poster image with fade-in */}
        {posterUrl && (
          <img
            src={posterUrl}
            alt=""
            className={cn(
              "absolute inset-0 h-full w-full object-cover z-[1] transition-opacity duration-200 ease-out",
              posterLoaded ? "opacity-100" : "opacity-0",
              videoIsReady && "!opacity-0 duration-150"
            )}
            loading={isPriority ? "eager" : "lazy"}
            fetchPriority={isPriority ? "high" : "auto"}
            decoding="async"
            onLoad={() => setPosterLoaded(true)}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        {hasVideo && hlsUrl && !hasError ? (
          <>
            {/* Play-gated video layer */}
            <div
              className={cn(
                "absolute inset-0 z-[2] transition-opacity duration-150 ease-out",
                videoIsReady ? "opacity-100" : "opacity-0"
              )}
              aria-busy={!isVideoReady}
            >
              <UnifiedVideoPlayer
                key={retryKey}
                src={hlsUrl}
                posterUrl={posterUrl}
                autoplay={shouldPlay}
                muted
                objectFit="cover"
                mediaId={streamId}
                preload="auto"
                surface="videos"
                managedByMediaRuntime={true}
                onPlay={handlePlay}
                onError={handleError}
                className="absolute inset-0 w-full h-full group-hover:scale-[1.02] transition-transform duration-500"
              />
            </div>

            {/* Play overlay on hover (only when not playing) */}
            {isVideoReady && !shouldPlay && (
              <div className="absolute inset-0 z-[3] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Play className="h-6 w-6 text-foreground ml-0.5" fill="currentColor" />
                </div>
              </div>
            )}
          </>
        ) : hasError ? (
          /* Error state overlay */
          <div className="absolute inset-0 z-[3] bg-black/40 flex flex-col items-center justify-center gap-2">
            <button
              onClick={handleRetry}
              className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center active:scale-[0.95] transition-transform"
              aria-label="Retry playback"
            >
              <RotateCw className="w-5 h-5 text-gray-800" />
            </button>
            <span className="text-white/70 text-xs">Tap to retry</span>
          </div>
        ) : !posterUrl && (
          /* Fallback when no video or thumbnail */
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}

        {/* Bottom gradient overlay for better badge contrast */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-[4]" />

        {/* Trending label - top left */}
        {video.isTrending && (
          <div className="absolute top-3 left-3 z-[5] flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold rounded-full shadow-lg shadow-orange-500/30">
            <Flame className="h-3.5 w-3.5" />
            <span>Trending</span>
          </div>
        )}

        {/* Queue menu - top right */}
        {(onPlayNext || onEnqueue) && (
          <VideoQueueMenu
            videoId={video.id}
            videoTitle={video.title}
            thumbnailUrl={video.thumbnailUrl}
            creatorName={video.creatorName}
            durationSeconds={video.durationSeconds}
            onPlayNext={onPlayNext || (() => {})}
            onEnqueue={onEnqueue || (() => {})}
            className="absolute top-3 right-3 z-[5]"
          />
        )}

        {/* Likes - bottom left */}
        {(video.likes || video.views) && (video.likes || 0) > 0 && (
          <div className="absolute bottom-3 left-3 z-[5] flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full">
            <Heart className="w-3.5 h-3.5 text-white" fill="white" />
            <span className="text-white text-xs font-medium">
              {formatLikes(video.likes || video.views)}
            </span>
          </div>
        )}

        {/* Duration badge - bottom right */}
        <div className="absolute bottom-3 right-3 z-[5] px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold tabular-nums rounded-md">
          {video.duration}
        </div>
      </div>

      {/* Meta Area */}
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Creator avatar */}
        <button
          onClick={handleCreatorClick}
          className="shrink-0 mt-0.5 overflow-hidden shadow-sm transition-all hover:ring-2 hover:ring-primary/20"
          style={{
            width: '40px',
            aspectRatio: '1 / 1.05',
            borderRadius: '34%',
          }}
        >
          <GolferAvatar
            name={video.creatorName}
            photoUrl={video.creatorAvatarUrl}
            size={40}
          />
        </button>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {video.title}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
            <button
              onClick={handleCreatorClick}
              className="font-medium hover:text-foreground transition-colors truncate"
            >
              {video.creatorName}
            </button>
            <span className="text-muted-foreground/50">·</span>
            <span>{video.createdAt ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true }) : 'Recently'}</span>
            {(video.likes || video.views) ? (
              <>
                <span className="text-muted-foreground/50">·</span>
                <span>{formatLikes(video.likes || video.views)} likes</span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LongFormVideoTileAutoplay;