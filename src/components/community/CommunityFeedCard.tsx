/**
 * CommunityFeedCard - Full-width feed card for community posts (images + videos)
 * Clubhouse Gold Standard Implementation:
 * - UnifiedVideoPlayer with managedByMediaRuntime + surface="friends-feed"
 * - Play-gated poster-to-video crossfade (onPlay + 100ms buffer, no timeout)
 * - Shimmer base layer + poster fade-in (200ms)
 * - Mount gating via shouldMountVideo prop
 * - Carousel video mount gating (active + adjacent only)
 * - Silent error handling (poster fallback)
 * - GlobalAudioContext integration
 * - Review post visual indicators (pill badges, rating, course info)
 * - Multi-media carousel with swipe/dots/chevrons
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { MoreHorizontal, MapPin, Copy, Share2, Flag, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { supabase } from '@/integrations/supabase/client';
import { useGlobalAudio } from '@/contexts/GlobalAudioContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import CommentsPage from '@/components/clubhouse/cinematic/CommentsPage';

// Helper to remove the "📍 Played at" line from content
function removePlayedAtLine(content: string | null): string {
  if (!content) return '';
  const playedAtRegex = /\n*📍\s*Played at\s+[^\n]+\n*/gi;
  return content.replace(playedAtRegex, '').trim();
}
const getAspectRatio = (item: CommunityContentItem): number => {
  const media = (item as any).media?.[0];
  if (media?.width && media?.height) {
    const rawRatio = media.width / media.height;
    const minRatio = 0.8;  // Portrait limit (4:5)
    const maxRatio = 2.0;  // Landscape limit (2:1)
    return Math.max(minRatio, Math.min(maxRatio, rawRatio));
  }
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
  isPriorityItem?: boolean;
  shouldMountVideo?: boolean; // Fix 1: mount gating
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
  shouldMountPlayer: boolean; // Fix 1 + Fix 5: mount gating
  onError?: () => void; // Fix 6: error handling
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
  shouldMountPlayer,
  onError,
}: MediaItemProps) {
  const [imageError, setImageError] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false); // Fix 4: poster fade-in
  const [isVideoReady, setIsVideoReady] = useState(false); // Fix 3: play-gated
  const isVideoReadyTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isVideo = media.media_type === 'video';
  const { isGloballyMuted } = useGlobalAudio(); // Fix 7: GlobalAudioContext
  
  // Fix 3: play-gated transition
  const handlePlay = useCallback(() => {
    isVideoReadyTimerRef.current = setTimeout(() => {
      setIsVideoReady(true);
      onVideoReady();
    }, 100);
  }, [onVideoReady]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (isVideoReadyTimerRef.current) {
        clearTimeout(isVideoReadyTimerRef.current);
      }
    };
  }, []);

  // Reset video ready state when item changes
  useEffect(() => {
    setIsVideoReady(false);
    setPosterLoaded(false);
  }, [media.id]);
  
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
      <div className={cn("absolute inset-0", filterClass)}>
        {/* Fix 4: Shimmer base layer — fades out once poster or video is ready */}
        <div className={cn("absolute inset-0 bg-muted/50 overflow-hidden transition-opacity duration-300", (posterLoaded || isVideoReady) ? "opacity-0" : "opacity-100")}>
          <div className="h-full w-full -translate-x-full motion-safe:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
        </div>

        {/* Poster layer — stays until play-gated video ready */}
        {posterUrl && (
          <img
            src={posterUrl}
            alt=""
            className={cn(
              "absolute inset-0 w-full h-full object-cover z-[1] transition-opacity duration-200",
              posterLoaded ? "opacity-100" : "opacity-0",
              isVideoReady && "opacity-0 duration-150"
            )}
            loading={isPriorityItem ? "eager" : "lazy"}
            fetchPriority={isPriorityItem ? "high" : "auto"}
            decoding="async"
            onLoad={() => setPosterLoaded(true)}
          />
        )}

        {/* Fix 1 + 5: Only mount player if allowed */}
        {shouldMountPlayer && (
          <div className={cn("absolute inset-0 z-[2]", !isVideoReady && "opacity-0")}>
            <UnifiedVideoPlayer
              ref={playerRef}
              src={hlsUrl}
              posterUrl={posterUrl || undefined}
              autoplay={isPlaying && isActive}
              muted={isGloballyMuted} // Fix 7: GlobalAudioContext
              loop
              preload={isPlaying ? "auto" : "metadata"} // Fix 10: preload optimization
              showMuteButton={false}
              showPlayButton={false}
              scrubber={false}
              mediaId={streamId}
              className="w-full h-full object-cover"
              onPlay={handlePlay} // Fix 3: play-gated
              onError={() => { // Fix 6: silent error handling
                console.warn('[CommunityFeedCard] Video playback error, keeping poster visible', { itemId, streamId });
                onError?.();
              }}
              managedByMediaRuntime={true} // Fix 2: MediaRuntime
              surface="friends-feed" // Fix 2: MediaRuntime
            />
          </div>
        )}
      </div>
    );
  }

  // Image rendering with shimmer + fade-in
  return (
    <div className={cn("absolute inset-0 w-full h-full", filterClass)}>
      {/* Fix 4: Shimmer base for images — fades out once loaded */}
      <div className={cn("absolute inset-0 bg-muted/50 overflow-hidden transition-opacity duration-300", posterLoaded ? "opacity-0" : "opacity-100")}>
        <div className="h-full w-full -translate-x-full motion-safe:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
      </div>

      {!imageError ? (
        <img
          src={media.media_url}
          alt=""
          className={cn(
            "absolute inset-0 w-full h-full object-cover z-[1] transition-opacity duration-200",
            posterLoaded ? "opacity-100" : "opacity-0"
          )}
          loading={isPriorityItem ? "eager" : "lazy"}
          fetchPriority={isPriorityItem ? "high" : "auto"}
          decoding="async"
          onLoad={() => setPosterLoaded(true)}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-muted z-[1]">
          <span className="text-4xl">📷</span>
        </div>
      )}
    </div>
  );
});

/**
 * CommunityFeedCard - Premium Card with UnifiedVideoPlayer
 * Header → Caption → Course Tag → Media → Social proof → Action bar
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
  shouldMountVideo = true, // Fix 1: default true for backwards compat
}: CommunityFeedCardProps) {
  const navigate = useNavigate();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const tileRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const mediaIndexRef = useRef(videoIndex);
  mediaIndexRef.current = videoIndex;

  // Get current user for delete check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });
  }, []);

  const isOwnPost = currentUserId && item.user?.id === currentUserId;

  // Get media array
  const mediaItems = useMemo(() => item.media || [], [item.media]);
  const hasMultipleMedia = mediaItems.length > 1;
  const currentMedia = mediaItems[activeMediaIndex];

  // Reset state when item changes
  useEffect(() => {
    setIsVideoReady(false);
    setActiveMediaIndex(0);
  }, [item.id]);

  const isVideo = item.type === 'video';
  const hasMedia = !!item.src;
  const filterClass = getFilterClass((item as any).filterId);
  
  const aspectRatio = useMemo(() => getAspectRatio(item), [item]);
  const durationDisplay = useMemo(() => formatDuration(item.duration || item.durationSeconds), [item.duration, item.durationSeconds]);

  // Review data
  const isReview = !!(item as any).isReview;
  const reviewRating = (item as any).reviewRating as number | null;
  const golfCourse = (item as any).golfCourse as { id: string; name: string; country: string; sub_country?: string; region?: string } | undefined;

  const handleVideoReady = useCallback(() => {
    setIsVideoReady(true);
  }, []);

  // Engagement data
  const { likesCount, commentsCount } = usePostEngagement(item.id);

  const timeAgo = formatTimeAgo(item.createdAt, 'short');

  const captionText = useMemo(() => removePlayedAtLine(item.title || ''), [item.title]);
  const shouldTruncate = captionText.length > 150 && !isExpanded;
  const displayContent = shouldTruncate ? captionText.slice(0, 150) : captionText;

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

  const handleDeletePost = useCallback(async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('posts').delete().eq('id', item.id);
      if (error) throw error;
      toast.success('Post deleted');
      setDeleteDialogOpen(false);
    } catch (err) {
      toast.error('Failed to delete post');
    } finally {
      setIsDeleting(false);
    }
  }, [item.id]);

  const handleCreatorClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (item.user?.id) {
      onCreatorClick?.(item.user.id);
    }
  };

  const handleCourseClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (golfCourse?.id) {
      navigate(`/courses/${golfCourse.id}`);
    }
  }, [golfCourse, navigate]);

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
          "rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm mx-4 will-change-transform",
          isReview && "border-t-2 border-t-amber-400",
          className
        )}
      >
        {/* Header - creator row */}
        <div 
          className="flex items-start gap-3 cursor-pointer px-4 pt-4"
          onClick={handleCreatorClick}
        >
          <div className="flex-shrink-0">
            <SquircleAvatar
              size={40}
              src={item.user?.avatar}
              alt={item.user?.name || 'User'}
              fallback={item.user?.name?.charAt(0) || '?'}
              hideRing
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 text-sm leading-tight truncate">
              {item.user?.name || 'User'}
            </p>
            <p className="text-xs text-gray-400 leading-tight truncate">
              {timeAgo}
            </p>
          </div>
          <div className="flex-shrink-0 self-start" onClick={(e) => e.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-1.5 hover:bg-gray-50 rounded-full transition-colors"
                  aria-label="Post options"
                >
                  <MoreHorizontal className="h-5 w-5 text-gray-300" />
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
                {isOwnPost && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => {
                        navigate('/create-moment', { state: { editPostId: item.id, backgroundLocation: location } });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Edit post
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => setDeleteDialogOpen(true)} 
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
                {!isOwnPost && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleReport} className="text-destructive focus:text-destructive">
                      <Flag className="h-4 w-4 mr-2" />
                      Report
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Caption */}
        {captionText && (
          <div className="px-4 pt-2">
            <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {displayContent}
              {shouldTruncate && (
                <>
                  {'... '}
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="text-emerald-600 font-medium"
                  >
                    more
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Course Location - clickable */}
        {golfCourse && (
          <div 
            className={cn(
              "flex items-start gap-2 px-4 pb-3 cursor-pointer active:scale-[0.98] transition-transform",
              captionText && "border-t border-gray-50 pt-2 mt-1"
            )}
            onClick={handleCourseClick}
          >
            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-gray-800 text-[13px] leading-tight truncate">{golfCourse.name}</span>
              {courseLocation && (
                <span className="text-gray-400 text-xs leading-tight truncate">{courseLocation}</span>
              )}
            </div>
          </div>
        )}

        {/* Media - Full Width within card */}
        <div 
          className="relative w-full cursor-pointer overflow-hidden"
          style={{ aspectRatio }}
          onClick={handleMediaClick}
          aria-busy={isVideo && !isVideoReady}
        >
          {/* Multi-media Carousel or Single Media */}
          {hasMultipleMedia ? (
            <>
              <div
                ref={carouselRef}
                className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory touch-pan-x touch-pan-y h-full w-full"
                onScroll={handleScroll}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {mediaItems.map((media, idx) => {
                  // Fix 5: Carousel mount gating — only mount player for active + adjacent
                  const isCarouselActive = activeMediaIndex === idx;
                  const isCarouselAdjacent = Math.abs(activeMediaIndex - idx) <= 1;
                  const shouldMountCarouselPlayer = shouldMountVideo && (isCarouselActive || isCarouselAdjacent);

                  return (
                    <div 
                      key={media.id} 
                      className="flex-shrink-0 w-full h-full snap-start relative"
                    >
                      <MediaItem
                        media={media}
                        isActive={isCarouselActive}
                        isPlaying={isPlaying}
                        isPriorityItem={isPriorityItem && idx === 0}
                        filterClass={filterClass}
                        itemId={item.id}
                        onVideoReady={handleVideoReady}
                        playerRef={idx === 0 ? playerRef : undefined}
                        shouldMountPlayer={shouldMountCarouselPlayer}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Chevron Navigation */}
              {activeMediaIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center transition-opacity"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-5 w-5 text-gray-700" />
                </button>
              )}
              {activeMediaIndex < mediaItems.length - 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm shadow-sm flex items-center justify-center transition-opacity"
                  aria-label="Next"
                >
                  <ChevronRight className="h-5 w-5 text-gray-700" />
                </button>
              )}

              {/* Dot Indicators */}
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
            currentMedia && (
              <MediaItem
                media={currentMedia}
                isActive={true}
                isPlaying={isPlaying}
                isPriorityItem={isPriorityItem}
                filterClass={filterClass}
                itemId={item.id}
                onVideoReady={handleVideoReady}
                playerRef={playerRef}
                shouldMountPlayer={shouldMountVideo}
              />
            )
          )}

          {/* Review Indicators */}
          {isReview && (
            <>
              <div className="absolute top-3 left-3 z-10 pointer-events-none">
                <div className="bg-gray-900/70 backdrop-blur-sm rounded-lg px-2.5 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
                  Review
                </div>
              </div>
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

          {/* Duration Badge */}
          {isVideo && durationDisplay && !hasMultipleMedia && (
            <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 rounded text-white text-xs font-medium tabular-nums z-10 pointer-events-none">
              {durationDisplay}
            </div>
          )}
        </div>

        {/* Social proof line */}
        {(likesCount > 0 || commentsCount > 0) && (
          <div className="px-4 py-2 text-xs text-gray-400">
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
        <div className="px-4 pb-3 pt-1">
          <PostActionBar
            postId={item.id}
            onOpenComments={handleComment}
            shareTitle={item.title || item.user?.name || 'Post'}
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePost}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.likeCount === nextProps.item.likeCount &&
    prevProps.item.commentCount === nextProps.item.commentCount &&
    prevProps.item.src === nextProps.item.src &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.videoIndex === nextProps.videoIndex &&
    prevProps.isPriorityItem === nextProps.isPriorityItem &&
    prevProps.shouldMountVideo === nextProps.shouldMountVideo
  );
});

export default CommunityFeedCard;
