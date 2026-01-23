/**
 * LongFormVideoTileAutoplay - Video tile with visibility-based autoplay
 * 
 * UNIFIED WITH CLUBHOUSE: Uses the exact same video wiring pattern as
 * ClubhouseVerticalGrid for consistent autoplay behavior.
 * 
 * INSTANT VIDEO PATTERN:
 * - Uses managedByMediaRuntime={false}, externallyManaged={false}
 * - Uses autoplay based on visibility (IntersectionObserver)
 * - Uses preload="auto" for instant buffering
 * - Direct browser-led autoplay (no MediaRuntime manual control)
 */

import React, { useRef, useMemo, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Play, Flame, Heart } from 'lucide-react';
import { VideoQueueMenu } from './VideoQueueMenu';
import { GolferAvatar } from '@/components/golfers/GolferAvatar';
import { HLSPlayer, HLSPlayerRef, runtimeUserTap } from '@/media';
import { formatDistanceToNow } from 'date-fns';
import type { QueueItemMeta } from '@/hooks/useVideoQueue';
import type { LongFormVideo } from './LongFormVideoTile';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { isPosterFailed } from '@/utils/posterPrefetch';
import { useInView } from 'react-intersection-observer';

// Re-export for convenience
export type { LongFormVideo };

interface LongFormVideoTileAutoplayProps {
  video: LongFormVideo;
  onVideoClick?: (id: string) => void;
  onCreatorClick?: (creatorUserId: string) => void;
  onPlayNext?: (id: string, meta?: QueueItemMeta) => void;
  onEnqueue?: (id: string, meta?: QueueItemMeta) => void;
  className?: string;
}

/**
 * LongFormVideoTileAutoplay - Video tile unified with Clubhouse pattern
 * Uses direct visibility-based autoplay via IntersectionObserver
 */
export const LongFormVideoTileAutoplay: React.FC<LongFormVideoTileAutoplayProps> = ({
  video,
  onVideoClick,
  onCreatorClick,
  onPlayNext,
  onEnqueue,
  className,
}) => {
  const playerRef = useRef<HLSPlayerRef>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const hasReportedReadyRef = useRef(false);
  
  // UNIFIED: Visibility-based autoplay via IntersectionObserver
  const { ref: tileRef, inView: isVisible } = useInView({
    threshold: 0.4, // Play when 40% visible (matches Clubhouse)
    triggerOnce: false,
  });

  const hasVideo = !!video.mediaUrl;

  // CRITICAL: Extract stream UID for cache consistency
  const streamId = useMemo(() => {
    return uidFromNode({ src: video.mediaUrl }) || video.id;
  }, [video.mediaUrl, video.id]);

  // UNIFIED: Generate HLS URL and poster URL exactly like Clubhouse
  const hlsUrl = streamId ? generateStreamHlsUrl(streamId) : null;
  const generatedPosterUrl = streamId ? generateStreamThumbnailUrl(streamId, { height: 720, fit: 'cover' }) : undefined;
  const posterUrl = generatedPosterUrl && !isPosterFailed(generatedPosterUrl) ? generatedPosterUrl : video.thumbnailUrl;

  // Reset ready flag when video changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setIsVideoReady(false);
  }, [video.id]);

  // UNIFIED: Use canplaythrough for buffered ready state
  const handleCanPlayThrough = () => {
    if (!hasReportedReadyRef.current) {
      hasReportedReadyRef.current = true;
      setIsVideoReady(true);
    }
  };

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
      {/* Media Section - 16:9 aspect ratio */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted">
        {/* Poster-first: always show thumbnail immediately */}
        {posterUrl && (
          <img
            src={posterUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        )}

        {hasVideo && hlsUrl ? (
          <>
            {/* 
              UNIFIED WITH CLUBHOUSE: HLSPlayer uses same props as Clubhouse VideoWithAutoplay.
              - managedByMediaRuntime={false} for direct browser-led autoplay
              - externallyManaged={false} for HLS.js internal management
              - autoplay based on visibility
              - preload="auto" for instant buffering
            */}
            <div
              className={cn(
                "absolute inset-0 transition-opacity duration-200",
                isVideoReady ? "opacity-100" : "opacity-0"
              )}
            >
              <HLSPlayer
                ref={playerRef}
                src={hlsUrl}
                posterUrl={posterUrl}
                autoplay={isVisible}
                muted
                loop
                aspectRatio="16:9"
                objectFit="cover"
                showMuteButton={false}
                showPlayButton={false}
                showScrubber={false}
                managedByMediaRuntime={false}
                externallyManaged={false}
                mediaId={streamId}
                preload="auto"
                onCanPlayThrough={handleCanPlayThrough}
                className="absolute inset-0 w-full h-full group-hover:scale-[1.02] transition-transform duration-500"
              />
            </div>

            {/* Play overlay on hover (only when not playing) */}
            {isVideoReady && !isVisible && (
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Play className="h-6 w-6 text-foreground ml-0.5" fill="currentColor" />
                </div>
              </div>
            )}
          </>
        ) : !posterUrl && (
          /* Fallback when no video or thumbnail */
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}

        {/* Bottom gradient overlay for better badge contrast */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {/* Trending label - top left */}
        {video.isTrending && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold rounded-full shadow-lg shadow-orange-500/30">
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
            className="absolute top-3 right-3"
          />
        )}

        {/* Likes - bottom left */}
        {(video.likes || video.views) && (video.likes || 0) > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full">
            <Heart className="w-3.5 h-3.5 text-white" fill="white" />
            <span className="text-white text-xs font-medium">
              {formatLikes(video.likes || video.views)}
            </span>
          </div>
        )}

        {/* Duration badge - bottom right */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold tabular-nums rounded-md">
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
