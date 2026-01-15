/**
 * CommunityFeedCard - Full-width feed card for community posts (images + videos)
 * Matches LongFormFeedCard/BusinessPostCard layout exactly:
 * - Header: Avatar + Name + Followers + Time + Menu (ABOVE media)
 * - Caption: Text content
 * - Divider
 * - Media: Full-width image/video with duration badge (if video)
 * - Social proof: Likes / Comments
 * - Action bar: Like / Comment / Reshare / Send
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MoreHorizontal, MapPin, Copy, Share2, Flag } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { PostActionBar } from '@/components/posts/PostActionBar';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { formatTimeAgo } from '@/utils/formatTime';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { HLSPlayer, HLSPlayerRef, runtimeUserTap } from '@/media';
import type { RegisterMediaFn } from '@/media';
import type { CommunityContentItem } from '@/hooks/community/useCommunityFeed';
import { getFilterClass } from '@/utils/studioFilters';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CommentsPage from '@/components/clubhouse/cinematic/CommentsPage';

// Helper to calculate aspect ratio from media dimensions
const getAspectRatio = (item: CommunityContentItem): number => {
  const media = (item as any).media?.[0];
  if (media?.width && media?.height) {
    const rawRatio = media.width / media.height;
    // Clamp to reasonable bounds
    const minRatio = 0.5;  // Portrait limit (1:2)
    const maxRatio = 2.0;  // Landscape limit (2:1)
    return Math.max(minRatio, Math.min(maxRatio, rawRatio));
  }
  // Fallback based on type
  return item.type === 'video' ? 16 / 9 : 4 / 5;
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

interface CommunityFeedCardProps {
  item: CommunityContentItem;
  onCardClick?: (id: string, index: number) => void;
  onCreatorClick?: (creatorUserId: string) => void;
  className?: string;
  registerVideo?: RegisterMediaFn;
  isPlaying?: boolean;
  videoIndex?: number;
}

/**
 * CommunityFeedCard - Card matching LongFormFeedCard structure exactly
 * Header → Caption → Divider → Media → Social proof → Action bar
 */
export const CommunityFeedCard: React.FC<CommunityFeedCardProps> = ({
  item,
  onCardClick,
  onCreatorClick,
  className,
  registerVideo,
  isPlaying = false,
  videoIndex = 0,
}) => {
  const [imageError, setImageError] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const playerRef = useRef<HLSPlayerRef>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const mediaIndexRef = useRef(videoIndex);
  mediaIndexRef.current = videoIndex;

  const isVideo = item.type === 'video';
  const hasMedia = !!item.src;
  const filterClass = getFilterClass((item as any).filterId);
  
  // Calculate dynamic aspect ratio from media dimensions
  const aspectRatio = useMemo(() => getAspectRatio(item), [item]);
  const isPortrait = aspectRatio < 1;
  const durationDisplay = useMemo(() => formatDuration(item.duration || item.durationSeconds), [item.duration, item.durationSeconds]);

  // Engagement data
  const { likesCount, commentsCount } = usePostEngagement(item.id);

  // Format timestamp
  const timeAgo = formatTimeAgo(item.createdAt, 'short');

  // Caption text
  const captionText = item.title || '';
  const shouldTruncate = captionText.length > 150 && !isExpanded;
  const displayContent = shouldTruncate ? captionText.slice(0, 150) : captionText;

  // Golf course info
  const golfCourse = (item as any).golfCourse;

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
          sortIndex: mediaIndexRef.current,
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
        sortIndex: mediaIndexRef.current,
      });
    };
  }, [registerVideo, item.id, isVideo, hasMedia]);

  const handleComment = useCallback(() => {
    setCommentsOpen(true);
  }, []);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/clubhouse/post/${item.id}`);
    toast.success('Link copied');
  }, [item.id]);

  const handleSend = useCallback(async () => {
    const url = `${window.location.origin}/clubhouse/post/${item.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title || 'Post', url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  }, [item.id, item.title]);

  const handleReport = useCallback(() => {
    toast.info('Report functionality coming soon');
  }, []);

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.user?.id) {
      onCreatorClick?.(item.user.id);
    }
  };

  const handleMediaClick = useCallback(() => {
    if (isVideo) {
      runtimeUserTap(item.id);
    }
    onCardClick?.(item.id, videoIndex);
  }, [isVideo, item.id, videoIndex, onCardClick]);

  return (
    <>
      <div
        ref={tileRef}
        className={cn(
          "bg-white overflow-hidden border-x border-border/40",
          className
        )}
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        {/* Header - 3 column layout: avatar / meta / actions */}
        <div 
          className="flex items-start gap-3 cursor-pointer" 
          style={{ padding: '12px 16px 8px 16px' }}
          onClick={handleCreatorClick}
        >
          {/* Left: Avatar */}
          <div className="flex-shrink-0">
            <SquircleAvatar
              size={40}
              src={item.user?.avatar}
              alt={item.user?.name || 'User'}
              fallback={item.user?.name?.charAt(0) || '?'}
              hideRing
            />
          </div>

          {/* Middle: Meta */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm leading-tight truncate">
              {item.user?.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
              <span>{timeAgo}</span>
            </p>
          </div>

          {/* Right: Menu */}
          <div className="flex-shrink-0 self-start" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 hover:bg-muted/50 rounded-full transition-colors"
                  aria-label="Post options"
                >
                  <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSend}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Send
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleReport} className="text-destructive focus:text-destructive">
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Caption */}
        {captionText && (
          <div style={{ padding: '0 16px 10px 16px' }}>
            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {displayContent}
              {shouldTruncate && (
                <>
                  {'... '}
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="text-muted-foreground hover:text-foreground hover:underline"
                  >
                    more
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Golf Course Location */}
        {golfCourse?.name && (
          <div 
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
            style={{ padding: '0 16px 8px 16px' }}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>At {golfCourse.name}</span>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-border/30 mx-4" />

        {/* Media - Full Width with native aspect ratio */}
        <div 
          className="relative w-full cursor-pointer bg-muted overflow-hidden"
          style={{ aspectRatio }}
          onClick={handleMediaClick}
        >
          {isVideo && hasMedia ? (
            /* Video with filter - no play overlay */
            <div className={cn("absolute inset-0 w-full h-full", filterClass)}>
              <HLSPlayer
                ref={playerRef}
                src={item.src}
                autoplay={isPlaying}
                muted
                loop
                aspectRatio={isPortrait ? '3:4' : '16:9'}
                objectFit="cover"
                externallyManaged
                mediaId={item.id}
                className="absolute inset-0 w-full h-full"
              />
            </div>
          ) : hasMedia ? (
            /* Image with filter */
            <div className={cn("absolute inset-0 w-full h-full", filterClass)}>
              {!imageError ? (
                <img
                  src={item.src}
                  alt={item.title || 'Photo'}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-100">
                  <span className="text-4xl">📷</span>
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20" />
          )}

          {/* Duration Badge - videos only */}
          {isVideo && durationDisplay && (
            <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 rounded text-white text-xs font-medium tabular-nums">
              {durationDisplay}
            </div>
          )}
        </div>

        {/* Social proof line */}
        {(likesCount > 0 || commentsCount > 0) && (
          <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border/30">
            {likesCount > 0 && <span>{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>}
            {likesCount > 0 && commentsCount > 0 && <span> · </span>}
            {commentsCount > 0 && (
              <button onClick={handleComment} className="hover:underline">
                {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
        )}

        {/* Action bar */}
        <PostActionBar
          postId={item.id}
          onOpenComments={handleComment}
          shareTitle={item.title || item.user?.name || 'Post'}
        />
      </div>

      {/* Comments Drawer */}
      <CommentsPage
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        postId={item.id}
        videoThumbnail={item.src}
        aspectRatio={aspectRatio}
        creatorName={item.user?.name || 'User'}
        creatorAvatar={item.user?.avatar}
        theme="grey"
      />
    </>
  );
};

export default CommunityFeedCard;
