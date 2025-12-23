import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Heart, Play } from 'lucide-react';
import { GolferAvatar } from '@/components/golfers/GolferAvatar';
import { HLSPlayer, HLSPlayerRef, runtimeUserTap } from '@/media';
import { formatDistanceToNow } from 'date-fns';
import type { RegisterMediaFn } from '@/media';
import type { CommunityContentItem } from '@/hooks/community/useCommunityFeed';

interface CommunityFeedCardProps {
  item: CommunityContentItem;
  onVideoClick?: (id: string) => void;
  onCreatorClick?: (creatorUserId: string) => void;
  className?: string;
  registerVideo?: RegisterMediaFn;
  isPlaying?: boolean;
  videoIndex?: number;
}

/**
 * CommunityFeedCard - Card for Community tab matching Videos tab layout exactly
 * Uses same structure as LongFormVideoTileAutoplay for consistency
 */
export const CommunityFeedCard: React.FC<CommunityFeedCardProps> = ({
  item,
  onVideoClick,
  onCreatorClick,
  className,
  registerVideo,
  isPlaying = false,
  videoIndex = 0,
}) => {
  const playerRef = useRef<HLSPlayerRef>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const isVideo = item.type === 'video';
  const hasMedia = !!item.src;

  const videoIndexRef = useRef(videoIndex);
  videoIndexRef.current = videoIndex;

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
    if (!count || count === 0) return null; // Hide when 0
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

  const handleCardClick = () => {
    if (isVideo) {
      runtimeUserTap(item.id);
    }
    onVideoClick?.(item.id);
  };

  const likesDisplay = formatLikes(item.likeCount);

  return (
    <div
      ref={tileRef}
      className={cn(
        "group cursor-pointer bg-card border border-border/30 overflow-hidden mb-3",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Media Section - 16:9 aspect ratio */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted">
        {isVideo && hasMedia ? (
          <>
            <HLSPlayer
              ref={playerRef}
              src={item.src}
              autoplay={isPlaying}
              muted
              loop
              aspectRatio="16:9"
              objectFit="cover"
              externallyManaged
              mediaId={item.id}
              className="absolute inset-0 w-full h-full"
            />
            
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
          <img
            src={item.src}
            alt={item.title || 'Photo'}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20" />
        )}

        {/* Subtle hover effect */}
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />

        {/* Likes - bottom left (hidden when 0) */}
        {likesDisplay && (
          <div 
            className="absolute bottom-3 left-3 flex items-center gap-1 text-white/70 text-[10px] leading-none font-medium"
            style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
          >
            <Heart className="w-3 h-3" />
            <span>{likesDisplay}</span>
          </div>
        )}

        {/* Duration badge for videos - bottom right */}
        {isVideo && item.duration && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded">
            {item.duration}
          </div>
        )}
      </div>

      {/* Meta Area - matches Videos tab layout */}
      <div className="px-4 py-3 flex items-end justify-between gap-3">
        <div className="flex-1 min-w-0 max-w-[80%]">
          {/* Title/Caption */}
          {item.title && (
            <p className="text-sm text-foreground line-clamp-2 leading-snug">
              {item.title}
            </p>
          )}
          {/* Creator name · date · likes (smaller meta row) */}
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

        {/* Avatar squircle - bottom right, no border/ring */}
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
};

export default CommunityFeedCard;
