import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Heart, Play } from 'lucide-react';
import { GolferAvatar } from '@/components/golfers/GolferAvatar';
import { HLSPlayer, HLSPlayerRef, runtimeUserTap } from '@/media';
import { formatDistanceToNow } from 'date-fns';
import PostMeta from '@/components/posts/PostMeta';
import type { RegisterMediaFn } from '@/media';
import type { CommunityContentItem } from '@/hooks/community/useCommunityFeed';
import { getFilterClass } from '@/utils/studioFilters';
import { getPixelLayerStyle } from '@/utils/studioEdit';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import type { CardOrientation } from '@/hooks/community/useNaturalFlowLayout';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamThumbnailUrl } from '@/config/cloudflareStream';

// Fixed aspect ratios for natural flow layout
const ASPECT_RATIOS: Record<CardOrientation, number> = {
  portrait: 4 / 5,    // 0.8 - tall (4:5)
  landscape: 16 / 9,  // 1.777 - wide (16:9)
};

// Format duration for display
const formatDuration = (duration?: string | number): string | null => {
  if (!duration) return null;
  
  let seconds: number;
  if (typeof duration === 'string') {
    seconds = parseInt(duration.replace('s', ''), 10);
  } else {
    seconds = Math.floor(duration);
  }
  
  if (isNaN(seconds) || seconds <= 0) return null;
  
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

interface CommunityNaturalFlowCardProps {
  item: CommunityContentItem;
  orientation: CardOrientation;
  onCardClick?: (id: string, index: number) => void;
  onCreatorClick?: (creatorUserId: string) => void;
  className?: string;
  registerVideo?: RegisterMediaFn;
  isPlaying?: boolean;
  videoIndex?: number;
  /** Called when video is ready to play (canplaythrough) */
  onReady?: (postId: string) => void;
}

/**
 * CommunityNaturalFlowCard - Card for natural flow layout with fixed portrait/landscape sizes
 * Uses 4:5 for portrait and 16:9 for landscape, full container width
 */
export const CommunityNaturalFlowCard = React.memo(function CommunityNaturalFlowCard({
  item,
  orientation,
  onCardClick,
  onCreatorClick,
  className,
  registerVideo,
  isPlaying = false,
  videoIndex = 0,
  onReady,
}: CommunityNaturalFlowCardProps) {
  const playerRef = useRef<HLSPlayerRef>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const isVideo = item.type === 'video';
  const hasMedia = !!item.src;
  const filterClass = getFilterClass((item as any).filterId);
  const studioEdits = (item as any).studioEdits;
  const pixelStyle = getPixelLayerStyle(studioEdits);
  
  // Generate poster URL for video poster-first display
  const posterUrl = useMemo(() => {
    if (!isVideo || !item.src) return undefined;
    const streamId = uidFromNode({ src: item.src });
    return streamId ? generateStreamThumbnailUrl(streamId, { height: 800 }) : undefined;
  }, [isVideo, item.src]);
  
  // Prevent duplicate ready reports
  const hasReportedReadyRef = useRef(false);

  // Reset hasReportedReady when item changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
  }, [item.id]);

  // Use fixed aspect ratio based on orientation
  const aspectRatio = ASPECT_RATIOS[orientation];
  const durationDisplay = useMemo(() => formatDuration(item.duration || item.durationSeconds), [item.duration, item.durationSeconds]);

  const videoIndexRef = useRef(videoIndex);
  videoIndexRef.current = videoIndex;

  // Handle video ready (buffered for smooth playback)
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current && isVideo) {
      hasReportedReadyRef.current = true;
      console.log(`[CommunityNaturalFlowCard] Video ${item.id.substring(0, 8)} ready (canplaythrough)`);
      onReady?.(item.id);
    }
  }, [item.id, isVideo, onReady]);

  // Register video with autoplay system
  useEffect(() => {
    if (!registerVideo || !isVideo || !hasMedia) return;

    const registerWithRef = () => {
      const videoEl = playerRef.current?.getElement();
      const tileEl = tileRef.current;
      
      if (videoEl && tileEl) {
        registerVideo({
          id: item.id,
          element: videoEl,
          observeTarget: tileEl,
          isCandidate: true,
          sortIndex: videoIndexRef.current,
        });
      } else {
        requestAnimationFrame(registerWithRef);
      }
    };

    const rafId = requestAnimationFrame(registerWithRef);

    return () => {
      cancelAnimationFrame(rafId);
      registerVideo({
        id: item.id,
        element: null,
        observeTarget: null,
        isCandidate: true,
        sortIndex: videoIndexRef.current,
      });
    };
  }, [registerVideo, item.id, isVideo, hasMedia]);

  const formatLikes = (count?: number): string | null => {
    if (!count || count === 0) return null;
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.user?.id) {
      onCreatorClick?.(item.user.id);
    }
  };

  const handleClick = () => {
    if (isVideo) {
      runtimeUserTap(item.id);
    }
    onCardClick?.(item.id, videoIndex);
  };

  const likesDisplay = formatLikes(item.likeCount);

  return (
    <div
      ref={tileRef}
      className={cn(
        "group cursor-pointer bg-card overflow-hidden w-full",
        className
      )}
      onClick={handleClick}
    >
      {/* Media Section - fixed aspect ratio based on orientation */}
      <div 
        className="relative w-full overflow-hidden bg-muted"
        style={{ aspectRatio }}
      >
        {isVideo && hasMedia ? (
          <>
            {/* Filtered pixel layer */}
            <div className={cn("absolute inset-0 w-full h-full", filterClass)} style={pixelStyle}>
              <HLSPlayer
                ref={playerRef}
                src={item.src}
                posterUrl={posterUrl}
                autoplay={isPlaying}
                muted
                loop
                aspectRatio={orientation === 'portrait' ? '3:4' : '16:9'}
                objectFit="cover"
                externallyManaged
                mediaId={uidFromNode({ src: item.src }) || item.id}
                className="absolute inset-0 w-full h-full"
                onCanPlayThrough={handleCanPlayThrough}
              />
            </div>
            
            {/* Play overlay on hover (only when not playing) */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/10 transition-colors">
                <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  <Play className="h-6 w-6 text-foreground ml-0.5" fill="currentColor" />
                </div>
              </div>
            )}
          </>
        ) : hasMedia ? (
          <div className={cn("absolute inset-0 w-full h-full", filterClass)} style={pixelStyle}>
            <img
              src={item.src}
              alt={item.title || 'Photo'}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20" />
        )}

        {/* Subtle hover effect */}
        {/* Text overlays */}
        {studioEdits?.textOverlays?.length > 0 && (
          <TextOverlayRenderer
            textOverlays={studioEdits.textOverlays}
            isEditable={false}
            safeAreaContext="feed"
          />
        )}

        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

        {/* Like counter - bottom left, glass style */}
        {likesDisplay && (
          <div className="absolute bottom-2 left-2 z-10">
            <div className="flex items-center gap-1 px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full">
              <Heart className="w-3 h-3 text-white fill-white" />
              <span className="text-xs text-white font-medium">{likesDisplay}</span>
            </div>
          </div>
        )}

        {/* Duration badge for videos - bottom right, glass style */}
        {isVideo && durationDisplay && (
          <div className="absolute bottom-2 right-2 z-10">
            <div className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full">
              <span className="text-xs text-white font-medium">{durationDisplay}</span>
            </div>
          </div>
        )}
      </div>

      {/* Meta Area */}
      <div className="px-4 py-3 flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0 max-w-[80%]">
          <PostMeta
            text={item.title}
            tags={(item as any).tags}
            golfCourse={(item as any).golfCourse}
            isDark={false}
            maxLines={2}
            showMore={false}
          />
          {/* Creator name · date · likes */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80 mt-1.5">
            <button
              onClick={handleCreatorClick}
              className="hover:text-foreground transition-colors truncate"
            >
              {item.user?.name || 'User'}
            </button>
            <span>·</span>
            <span>{item.createdAt ? formatDistanceToNow(new Date(item.createdAt), { addSuffix: true }) : 'Recently'}</span>
            {likesDisplay && (
              <>
                <span>·</span>
                <span>{likesDisplay} likes</span>
              </>
            )}
          </div>
        </div>

        {/* Avatar squircle */}
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
            name={item.user?.name || 'User'}
            photoUrl={item.user?.avatar}
            size={40}
          />
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.likeCount === nextProps.item.likeCount &&
    prevProps.item.commentCount === nextProps.item.commentCount &&
    prevProps.item.src === nextProps.item.src &&
    prevProps.orientation === nextProps.orientation &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.videoIndex === nextProps.videoIndex
  );
});

export default CommunityNaturalFlowCard;
