/**
 * CommunityFeedCard - Full-width feed card for community posts (images + videos)
 * TikTok-Level Implementation:
 * - UnifiedVideoPlayer with source stability + HLS pool promotion
 * - 150ms crossfade with ease-out
 * - Priority poster loading for first 6 items
 * - 3s first-frame fallback timeout
 * - GPU-accelerated container (will-change-transform)
 * - Review post visual indicators (pill badges, rating, course info)
 * - Multi-media carousel with swipe/dots/chevrons
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MoreHorizontal, MapPin, Copy, Share2, Flag, ChevronLeft, ChevronRight } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { PostActionBar } from '@/components/posts/PostActionBar';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { formatTimeAgo } from '@/utils/formatTime';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { runtimeUserTap } from '@/media';
import type { RegisterMediaFn } from '@/media';
import type { CommunityContentItem } from '@/hooks/community/useCommunityFeed';
import { getFilterClass } from '@/utils/studioFilters';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamThumbnailUrl, generateStreamHlsUrl } from '@/config/cloudflareStream';
import { isPosterFailed } from '@/utils/posterPrefetch';
import { RatingPill } from '@/components/ui/RatingPill';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CommentsPage from '@/components/clubhouse/cinematic/CommentsPage';

// 3s first-frame fallback timeout
const FIRST_FRAME_FALLBACK_MS = 3000;

// Helper to calculate aspect ratio from media dimensions
const getAspectRatio = (item: CommunityContentItem): number => {
  const media = (item as any).media?.[0];
  if (media?.width && media?.height) {
    const rawRatio = media.width / media.height;
    // Clamp to reasonable bounds
    const minRatio = 0.8;  // Portrait limit (4:5)
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
  /** Priority loading for first 6 items */
  isPriorityItem?: boolean;
}

// Single media item renderer
interface MediaItemProps {
  media: NonNullable<CommunityContentItem['media']>[0];
  isActive: boolean;
  isPlaying: boolean;
  isPriorityItem: boolean;
  filterClass: string;
  itemId: string;
  onVideoReady: () => void;
  playerRef?: React.RefObject<UnifiedVideoPlayerRef>;
}

const MediaItem = React.memo(function MediaItem({
  media,
  isActive,
  isPlaying,
  isPriorityItem,
  filterClass,
  itemId,
  onVideoReady,
  playerRef,
}: MediaItemProps) {
  const [imageError, setImageError] = useState(false);
  const isVideo = media.media_type === 'video';
  
  // Generate URLs for video
  const { hlsUrl, posterUrl, streamId } = useMemo(() => {
    if (!isVideo) {
      return { hlsUrl: null, posterUrl: media.media_url, streamId: media.id };
    }
    
    const extractedStreamId = uidFromNode({ src: media.media_url });
    if (!extractedStreamId) {
      return { hlsUrl: null, posterUrl: null, streamId: media.id };
    }
    
    const generatedPosterUrl = generateStreamThumbnailUrl(extractedStreamId, { height: 800, fit: 'cover' });
    const finalPosterUrl = generatedPosterUrl && !isPosterFailed(generatedPosterUrl) 
      ? generatedPosterUrl 
      : null;
    
    return {
      hlsUrl: generateStreamHlsUrl(extractedStreamId),
      posterUrl: finalPosterUrl,
      streamId: extractedStreamId,
    };
  }, [isVideo, media.media_url, media.id]);

  if (isVideo && hlsUrl) {
    return (
      <>
        {posterUrl && (
          <img
            src={posterUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading={isPriorityItem ? "eager" : "lazy"}
            fetchPriority={isPriorityItem ? "high" : "auto"}
            decoding="async"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
        <div className={cn("absolute inset-0", filterClass)}>
          <UnifiedVideoPlayer
            ref={playerRef}
            src={hlsUrl}
            posterUrl={posterUrl || undefined}
            autoplay={isPlaying && isActive}
            muted
            loop
            preload="auto"
            showMuteButton={false}
            showPlayButton={false}
            scrubber={false}
            mediaId={streamId}
            className="w-full h-full object-cover"
            onCanPlayThrough={onVideoReady}
          />
        </div>
      </>
    );
  }

  // Image
  return (
    <div className={cn("absolute inset-0 w-full h-full", filterClass)}>
      {!imageError ? (
        <img
          src={media.media_url}
          alt=""
          className="w-full h-full object-cover"
          loading={isPriorityItem ? "eager" : "lazy"}
          fetchPriority={isPriorityItem ? "high" : "auto"}
          decoding="async"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <span className="text-4xl">📷</span>
        </div>
      )}
    </div>
  );
});

/**
 * CommunityFeedCard - TikTok-Level Card with UnifiedVideoPlayer
 * Header → Caption → Divider → Media → Social proof → Action bar
 */
export const CommunityFeedCard = React.memo(function CommunityFeedCard({
  item,
  onCardClick,
  onCreatorClick,
  className,
  registerVideo,
  isPlaying = false,
  videoIndex = 0,
  isPriorityItem = false,
}: CommunityFeedCardProps) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const mediaIndexRef = useRef(videoIndex);
  mediaIndexRef.current = videoIndex;

  // Prevent duplicate ready reports
  const hasReportedReadyRef = useRef(false);
  const firstFrameTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get media array
  const mediaItems = useMemo(() => item.media || [], [item.media]);
  const hasMultipleMedia = mediaItems.length > 1;
  const currentMedia = mediaItems[activeMediaIndex];

  // Reset state when item changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setIsVideoReady(false);
    setActiveMediaIndex(0);
    
    if (firstFrameTimeoutRef.current) {
      clearTimeout(firstFrameTimeoutRef.current);
    }
  }, [item.id]);

  const isVideo = item.type === 'video';
  const hasMedia = !!item.src;
  const filterClass = getFilterClass((item as any).filterId);
  
  // Calculate dynamic aspect ratio from media dimensions
  const aspectRatio = useMemo(() => getAspectRatio(item), [item]);
  const durationDisplay = useMemo(() => formatDuration(item.duration || item.durationSeconds), [item.duration, item.durationSeconds]);

  // Review data
  const isReview = !!(item as any).isReview;
  const reviewRating = (item as any).reviewRating as number | null;
  const golfCourse = (item as any).golfCourse as { id: string; name: string; country: string; sub_country?: string; region?: string } | undefined;

  // P1: 3s first-frame fallback timeout for first video
  useEffect(() => {
    if (isPlaying && isVideo && !isVideoReady && activeMediaIndex === 0) {
      firstFrameTimeoutRef.current = setTimeout(() => {
        if (!hasReportedReadyRef.current) {
          hasReportedReadyRef.current = true;
          setIsVideoReady(true);
        }
      }, FIRST_FRAME_FALLBACK_MS);
      
      return () => {
        if (firstFrameTimeoutRef.current) {
          clearTimeout(firstFrameTimeoutRef.current);
        }
      };
    }
  }, [isPlaying, isVideo, isVideoReady, activeMediaIndex]);

  // Engagement data
  const { likesCount, commentsCount } = usePostEngagement(item.id);

  // Format timestamp
  const timeAgo = formatTimeAgo(item.createdAt, 'short');

  // Caption text
  const captionText = item.title || '';
  const shouldTruncate = captionText.length > 150 && !isExpanded;
  const displayContent = shouldTruncate ? captionText.slice(0, 150) : captionText;

  // Handle video ready (buffered for smooth playback)
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current && isVideo) {
      hasReportedReadyRef.current = true;
      setIsVideoReady(true);
      
      if (firstFrameTimeoutRef.current) {
        clearTimeout(firstFrameTimeoutRef.current);
      }
    }
  }, [isVideo]);

  // Register video with autoplay system
  useEffect(() => {
    if (!registerVideo || !isVideo || !hasMedia) return;

    const registerWithRef = () => {
      const videoEl = playerRef.current?.getVideoElement?.();
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

  // Carousel navigation
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.offsetWidth;
    const index = Math.round(scrollLeft / width);
    if (index !== activeMediaIndex && index >= 0 && index < mediaItems.length) {
      setActiveMediaIndex(index);
    }
  }, [activeMediaIndex, mediaItems.length]);

  const scrollToIndex = useCallback((index: number) => {
    if (carouselRef.current && index >= 0 && index < mediaItems.length) {
      carouselRef.current.scrollTo({ 
        left: index * carouselRef.current.offsetWidth, 
        behavior: 'smooth' 
      });
    }
  }, [mediaItems.length]);

  const handlePrev = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeMediaIndex > 0) {
      scrollToIndex(activeMediaIndex - 1);
    }
  }, [activeMediaIndex, scrollToIndex]);

  const handleNext = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeMediaIndex < mediaItems.length - 1) {
      scrollToIndex(activeMediaIndex + 1);
    }
  }, [activeMediaIndex, mediaItems.length, scrollToIndex]);

  // Get course location string
  const courseLocation = useMemo(() => {
    if (!golfCourse) return null;
    const parts = [golfCourse.region || golfCourse.sub_country, golfCourse.country].filter(Boolean);
    return parts.join(', ');
  }, [golfCourse]);

  return (
    <>
      <div
        ref={tileRef}
        className={cn(
          "bg-card overflow-hidden border-x border-border/40 will-change-transform",
          className
        )}
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        {/* Header - 3 column layout: avatar / meta / actions - reduced padding */}
        <div 
          className="flex items-start gap-3 cursor-pointer" 
          style={{ padding: '10px 16px 6px 16px' }}
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

          {/* Middle: Meta - tighter spacing */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm leading-tight truncate">
              {item.user?.name || 'User'}
            </p>
            <p className="text-xs text-muted-foreground leading-tight truncate">
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

        {/* Caption - reduced padding */}
        {captionText && (
          <div style={{ padding: '0 16px 6px 16px' }}>
            <div className="text-sm text-foreground whitespace-pre-wrap leading-snug">
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

        {/* Course Location Bar - Reviews only */}
        {isReview && golfCourse && (
          <div 
            className="flex items-center gap-1.5 text-[13px] pointer-events-none"
            style={{ padding: '0 16px 6px 16px' }}
          >
            <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
            <span className="font-semibold text-foreground truncate">{golfCourse.name}</span>
            {courseLocation && (
              <span className="text-muted-foreground truncate">· {courseLocation}</span>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-border/30 mx-4" />

        {/* Media - Full Width with native aspect ratio */}
        <div 
          className="relative w-full cursor-pointer bg-muted overflow-hidden"
          style={{ aspectRatio }}
          onClick={handleMediaClick}
          aria-busy={isVideo && !isVideoReady}
        >
          {/* Multi-media Carousel or Single Media */}
          {hasMultipleMedia ? (
            <>
              {/* Carousel container with scroll-snap */}
              <div
                ref={carouselRef}
                className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory touch-pan-x h-full w-full"
                onScroll={handleScroll}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {mediaItems.map((media, idx) => (
                  <div 
                    key={media.id} 
                    className="flex-shrink-0 w-full h-full snap-start relative"
                  >
                    <MediaItem
                      media={media}
                      isActive={activeMediaIndex === idx}
                      isPlaying={isPlaying}
                      isPriorityItem={isPriorityItem && idx === 0}
                      filterClass={filterClass}
                      itemId={item.id}
                      onVideoReady={handleCanPlayThrough}
                      playerRef={idx === 0 ? playerRef : undefined}
                    />
                  </div>
                ))}
              </div>

              {/* Chevron Navigation */}
              {activeMediaIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-opacity hover:bg-black/70"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5 text-white" />
                </button>
              )}
              {activeMediaIndex < mediaItems.length - 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center transition-opacity hover:bg-black/70"
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5 text-white" />
                </button>
              )}

              {/* Dot Indicators - max 10, then counter */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
                {mediaItems.length <= 10 ? (
                  <div className="flex gap-1.5">
                    {mediaItems.map((_, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "w-1.5 h-1.5 rounded-full transition-opacity",
                          activeMediaIndex === idx ? "bg-white" : "bg-white/50"
                        )}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="px-2 py-0.5 bg-black/60 rounded-full text-white text-xs font-medium">
                    {activeMediaIndex + 1}/{mediaItems.length}
                  </div>
                )}
              </div>
            </>
          ) : (
            // Single media item
            currentMedia && (
              <MediaItem
                media={currentMedia}
                isActive={true}
                isPlaying={isPlaying}
                isPriorityItem={isPriorityItem}
                filterClass={filterClass}
                itemId={item.id}
                onVideoReady={handleCanPlayThrough}
                playerRef={playerRef}
              />
            )
          )}

          {/* Review Indicators - pointer-events-none */}
          {isReview && (
            <>
              {/* Review Pill - Top Left */}
              <div className="absolute top-3 left-3 z-10 pointer-events-none">
                <div className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-[10px] font-bold uppercase tracking-wider">
                  Review
                </div>
              </div>

              {/* Rating Pill - Top Right */}
              {reviewRating !== null && reviewRating !== undefined && (
                <div className="absolute top-3 right-3 z-10 pointer-events-none">
                  <RatingPill 
                    score={reviewRating} 
                    showRatingInPill 
                    className="shadow-lg text-[10px] px-2 py-1"
                  />
                </div>
              )}
            </>
          )}

          {/* Duration Badge - videos only, single media */}
          {isVideo && durationDisplay && !hasMultipleMedia && (
            <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 rounded text-white text-xs font-medium tabular-nums z-10 pointer-events-none">
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
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.likeCount === nextProps.item.likeCount &&
    prevProps.item.commentCount === nextProps.item.commentCount &&
    prevProps.item.src === nextProps.item.src &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.videoIndex === nextProps.videoIndex &&
    prevProps.isPriorityItem === nextProps.isPriorityItem
  );
});

export default CommunityFeedCard;
