import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Play, Flame, Heart } from 'lucide-react';
import { VideoQueueMenu } from './VideoQueueMenu';
import { GolferAvatar } from '@/components/golfers/GolferAvatar';
import { HLSPlayer, HLSPlayerRef, runtimeUserTap } from '@/media';
import { formatDistanceToNow } from 'date-fns';
import type { QueueItemMeta } from '@/hooks/useVideoQueue';
import type { RegisterMediaFn } from '@/media';
import type { LongFormVideo } from './LongFormVideoTile';

// Re-export for convenience
export type { LongFormVideo };

interface LongFormVideoTileAutoplayProps {
  video: LongFormVideo;
  onVideoClick?: (id: string) => void;
  onCreatorClick?: (creatorUserId: string) => void;
  onPlayNext?: (id: string, meta?: QueueItemMeta) => void;
  onEnqueue?: (id: string, meta?: QueueItemMeta) => void;
  className?: string;
  // Autoplay integration - new unified system
  registerVideo?: RegisterMediaFn;
  isPlaying?: boolean;
  videoIndex?: number;
}

/**
 * LongFormVideoTileAutoplay - Video tile with grid autoplay support
 * Uses GridAutoplayVideo for HLS-aware muted autoplay in viewport
 */
export const LongFormVideoTileAutoplay: React.FC<LongFormVideoTileAutoplayProps> = ({
  video,
  onVideoClick,
  onCreatorClick,
  onPlayNext,
  onEnqueue,
  className,
  registerVideo,
  isPlaying = false,
  videoIndex = 0,
}) => {
  const playerRef = useRef<HLSPlayerRef>(null);
  const mediaWrapRef = useRef<HTMLDivElement>(null);
  const tileRef = useRef<HTMLDivElement>(null); // Sentinel for IntersectionObserver
  const hasVideo = !!video.mediaUrl;


  // Store videoIndex in a ref so registration doesn't retrigger when it changes
  const videoIndexRef = useRef(videoIndex);
  videoIndexRef.current = videoIndex;

  // Register video with grid autoplay system using useLayoutEffect for ref timing
  // Uses tileRef as observeTarget so IntersectionObserver observes the full tile, not the video element
  useEffect(() => {
    if (!registerVideo || !hasVideo) return;

    // Every video is a candidate for autoplay in long-form context
    const isCandidate = true;

    const registerWithRef = () => {
      const videoEl = playerRef.current?.getElement();
      const tileEl = tileRef.current;
      
      if (videoEl && tileEl) {
        if (import.meta.env.DEV) {
          console.log('[LongFormTile][register]', video.id.slice(0, 8), {
            hasVideoEl: !!videoEl,
            hasTileEl: !!tileEl,
            sortIndex: videoIndexRef.current,
          });
        }
        registerVideo({
          id: video.id,
          element: videoEl,
          observeTarget: tileEl, // Observe the tile wrapper, not the video element
          isCandidate,
          sortIndex: videoIndexRef.current,
        });
      } else {
        // Refs not ready, retry
        requestAnimationFrame(registerWithRef);
      }
    };

    // Use requestAnimationFrame for better ref timing than setTimeout
    const rafId = requestAnimationFrame(registerWithRef);

    return () => {
      cancelAnimationFrame(rafId);
      // Deregister on unmount
      registerVideo({
        id: video.id,
        element: null,
        observeTarget: null, // Explicit cleanup
        isCandidate,
        sortIndex: videoIndexRef.current,
      });
    };
    // IMPORTANT: Do NOT include videoIndex in deps - use ref instead to prevent re-registration
    // when section order changes due to lazy loading
  }, [registerVideo, video.id, hasVideo]);

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
        // Establish user intent before navigation to prevent autoplay churn
        runtimeUserTap(video.id);
        onVideoClick?.(video.id);
      }}
    >
      {/* Media Section - 16:9 aspect ratio */}
      <div
        ref={mediaWrapRef}
        className="relative w-full aspect-[16/9] overflow-hidden bg-muted"
      >
        {hasVideo ? (
          <>
            {/* HLSPlayer - unified video component with poster crossfade + built-in scrubber */}
            <HLSPlayer
              ref={playerRef}
              src={video.mediaUrl!}
              autoplay={isPlaying}
              muted
              loop
              aspectRatio="16:9"
              objectFit="cover"
              externallyManaged
              mediaId={video.id}
              className="absolute inset-0 w-full h-full group-hover:scale-[1.02] transition-transform duration-500"
            />
          </>
        ) : video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              // Hide broken image and show fallback
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        
        {/* Fallback when no thumbnail - always rendered behind image */}
        {!video.mediaUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}

        {/* Bottom gradient overlay for better badge contrast */}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

        {/* Play overlay on hover (only when not playing) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="w-14 h-14 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Play className="h-6 w-6 text-foreground ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Trending label - top left with gradient */}
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

        {/* Likes - bottom left with better contrast */}
        {(video.likes || video.views) && (video.likes || 0) > 0 && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-full">
            <Heart className="w-3.5 h-3.5 text-white" fill="white" />
            <span className="text-white text-xs font-medium">
              {formatLikes(video.likes || video.views)}
            </span>
          </div>
        )}

        {/* Duration badge - bottom right with better styling */}
        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold tabular-nums rounded-md">
          {video.duration}
        </div>
      </div>

      {/* Meta Area - matches CommunityFeedCard layout */}
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Creator avatar - left side */}
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
          {/* Title */}
          <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
            {video.title}
          </p>
          {/* Creator name · date · likes (smaller meta row) */}
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
