import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Heart, MessageCircle } from 'lucide-react';
import { GolferAvatar } from '@/components/golfers/GolferAvatar';
import { HLSPlayer, HLSPlayerRef, runtimeUserTap } from '@/media';
import type { RegisterMediaFn } from '@/media';
import type { CommunityContentItem } from '@/hooks/community/useCommunityFeed';
import { formatDistanceToNowStrict } from 'date-fns';

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
 * CommunityFeedCard - Card for Community tab with relationship indicator
 * Shows "Friend" or "Following" label next to the username
 * Photos NEVER show a video/play icon
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

  const formatLikes = (count?: number): string => {
    if (!count) return '0';
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
  };

  const formatTime = (dateString: string): string => {
    try {
      return formatDistanceToNowStrict(new Date(dateString), { addSuffix: false });
    } catch {
      return '';
    }
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

  return (
    <div
      ref={tileRef}
      className={cn(
        "group cursor-pointer bg-card border-b border-border/30 overflow-hidden",
        className
      )}
      onClick={handleCardClick}
    >
      {/* Media Section - 16:9 aspect ratio */}
      <div className="relative w-full aspect-[16/9] overflow-hidden bg-muted">
        {isVideo && hasMedia ? (
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
        ) : hasMedia ? (
          /* Photo - NO play icon ever */
          <img
            src={item.src}
            alt={item.title || 'Photo'}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20" />
        )}

        {/* Duration badge for videos only */}
        {isVideo && item.duration && (
          <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 backdrop-blur-sm text-white text-xs font-medium rounded">
            {item.duration}
          </div>
        )}

        {/* Engagement stats - bottom left */}
        <div 
          className="absolute bottom-3 left-3 flex items-center gap-3 text-white/80 text-xs"
          style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}
        >
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            {formatLikes(item.likeCount)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            {formatLikes(item.commentCount)}
          </span>
        </div>
      </div>

      {/* Meta Area */}
      <div className="px-4 py-3 flex items-start gap-3">
        {/* Avatar */}
        <button
          onClick={handleCreatorClick}
          className="shrink-0 overflow-hidden border border-border/40 shadow-sm hover:ring-2 hover:ring-ring transition-all"
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

        <div className="flex-1 min-w-0">
          {/* Username row with relationship and timestamp */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCreatorClick}
              className="text-sm font-medium text-foreground truncate hover:underline"
            >
              {item.user?.name || 'User'}
            </button>
            
            {/* Relationship indicator - small label */}
            <span className={cn(
              "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
              item.relationshipType === 'friend' 
                ? "bg-primary/10 text-primary" 
                : "bg-muted text-muted-foreground"
            )}>
              {item.relationshipType === 'friend' ? 'Friend' : 'Following'}
            </span>

            {/* Timestamp */}
            <span className="text-xs text-muted-foreground ml-auto">
              {formatTime(item.createdAt)}
            </span>
          </div>

          {/* Title/Content */}
          {item.title && (
            <p className="text-sm text-muted-foreground line-clamp-2 leading-snug mt-1">
              {item.title}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityFeedCard;
