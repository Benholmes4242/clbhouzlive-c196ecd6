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
        "group cursor-pointer bg-white border border-border/30 overflow-hidden",
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
              className="absolute inset-0 w-full h-full"
            />
          </>
        ) : video.thumbnailUrl ? (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
            <Play className="h-12 w-12 text-muted-foreground/40" />
          </div>
        )}


        {/* Subtle hover effect */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

        {/* Play overlay on hover (only when not playing) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
            <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
              <Play className="h-6 w-6 text-foreground ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Trending label - top left */}
        {video.isTrending && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-orange-500/90 text-white text-xs font-medium rounded-md">
            <Flame className="h-3 w-3" />
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
        <div 
          className="absolute bottom-3 left-3 flex items-center gap-1 text-white/70 text-[10px] leading-none font-medium"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
        >
          <Heart className="w-3 h-3" />
          <span>{formatLikes(video.likes || video.views)}</span>
        </div>

        {/* Duration badge - bottom right */}
        <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded">
          {video.duration}
        </div>
      </div>

      {/* Meta Area - matches CommunityFeedCard layout */}
      <div className="px-4 py-3 flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0 max-w-[80%]">
          {/* Title */}
          <p className="text-sm text-foreground line-clamp-2 leading-snug">
            {video.title}
          </p>
          {/* Creator name · date · likes (smaller meta row) */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80 mt-1.5">
            <button
              onClick={handleCreatorClick}
              className="hover:text-foreground transition-colors truncate"
            >
              {video.creatorName}
            </button>
            <span>·</span>
            <span>{video.createdAt ? formatDistanceToNow(new Date(video.createdAt), { addSuffix: true }) : 'Recently'}</span>
            {(video.likes || video.views) ? (
              <>
                <span>·</span>
                <span>{formatLikes(video.likes || video.views)} likes</span>
              </>
            ) : null}
          </div>
        </div>

        <button
          onClick={handleCreatorClick}
          className="shrink-0 overflow-hidden shadow-sm transition-all"
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
      </div>
    </div>
  );
};

export default LongFormVideoTileAutoplay;
