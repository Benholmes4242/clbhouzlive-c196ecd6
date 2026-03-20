/**
 * TaggedPostCard - Card for posts by others that tag this business
 * Similar to BusinessPostCard but shows author info instead of business
 * 
 * UNIFIED WITH CLUBHOUSE: Uses visibility-based autoplay via IntersectionObserver
 * - Dynamic aspect ratio (0.8-2.0 clamping)
 * - Multi-media carousel with chevrons + dots
 * - Review indicators (Review pill, rating pill, course bar)
 * - managedByMediaRuntime={false} for direct browser-led autoplay
 * - autoplay based on 50% start / 10% stop hysteresis
 * - preload="auto" for instant buffering
 */
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { TaggedPost } from '@/hooks/useBusinessTaggedPosts';
import { MoreHorizontal, Play, EyeOff, Flag, Copy, Share2, Loader2, MapPin, ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { getStreamPoster, getStreamIdFromUrl } from '@/utils/stream';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import CommentsSheet from '@/components/comments/CommentsSheet';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { PostActionBar } from '@/components/posts/PostActionBar';
import { toast } from 'sonner';
import TaggedText from '@/components/posts/TaggedText';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';

import { RatingPill } from '@/components/ui/RatingPill';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { isPosterFailed } from '@/utils/posterPrefetch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


// Helper to extract course info from content and remove the "Played at" line
function parsePlayedAtFromContent(content: string | null): {
  cleanContent: string;
  courseName: string | null;
  regionText: string | null;
} {
  if (!content) return { cleanContent: '', courseName: null, regionText: null };
  
  // Match the "📍 Played at Course Name, Region" pattern
  const playedAtRegex = /\n*📍\s*Played at\s+([^,\n]+)(?:,\s*([^\n]+))?\n*/i;
  const match = content.match(playedAtRegex);
  
  if (match) {
    const cleanContent = content.replace(playedAtRegex, '').trim();
    return {
      cleanContent,
      courseName: match[1]?.trim() || null,
      regionText: match[2]?.trim() || null,
    };
  }
  
  return { cleanContent: content, courseName: null, regionText: null };
}

// Helper to calculate aspect ratio from media dimensions
const getAspectRatio = (media: any): number => {
  if (media?.width && media?.height) {
    const rawRatio = media.width / media.height;
    const minRatio = 0.8;  // Portrait limit (4:5)
    const maxRatio = 2.0;  // Landscape limit (2:1)
    return Math.max(minRatio, Math.min(maxRatio, rawRatio));
  }
  // Fallback based on type
  return media?.media_type === 'video' ? 16 / 9 : 4 / 5;
};

// Media item renderer for carousel
interface MediaItemProps {
  media: any;
  isActive: boolean;
  isPlaying: boolean;
  isPriorityItem: boolean;
  onVideoReady: () => void;
  playerRef?: React.RefObject<UnifiedVideoPlayerRef>;
}

const MediaItem = React.memo(function MediaItem({
  media,
  isActive,
  isPlaying,
  isPriorityItem,
  onVideoReady,
  playerRef,
}: MediaItemProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const isVideo = media.media_type === 'video';

  // Generate URLs for video
  const { hlsUrl, posterUrl, streamId } = useMemo(() => {
    if (!isVideo) {
      return { hlsUrl: null, posterUrl: media.media_url, streamId: media.id };
    }
    
    const extractedStreamId = uidFromNode({ src: media.media_url }) || getStreamIdFromUrl(media.media_url || '');
    if (!extractedStreamId) {
      return { hlsUrl: null, posterUrl: media.poster_url || null, streamId: media.id };
    }
    
    const generatedPosterUrl = generateStreamThumbnailUrl(extractedStreamId, { height: 800, fit: 'cover' });
    const finalPosterUrl = media.poster_url || (generatedPosterUrl && !isPosterFailed(generatedPosterUrl) ? generatedPosterUrl : null);
    
    return {
      hlsUrl: generateStreamHlsUrl(extractedStreamId),
      posterUrl: finalPosterUrl,
      streamId: extractedStreamId,
    };
  }, [isVideo, media.media_url, media.id, media.poster_url]);

  if (isVideo && hlsUrl) {
    // TODO: Add managedByMediaRuntime={true} surface="business-feed" for full decoder management
    return (
      <>
        <div className="absolute inset-0">
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
        {/* Duration badge */}
        {media.duration_seconds != null && (
          <div className="absolute bottom-2 right-2 z-10 bg-black/60 backdrop-blur-sm rounded-md px-1.5 py-0.5 text-[10px] font-medium text-white pointer-events-none">
            {Math.floor(media.duration_seconds / 60)}:{String(Math.floor(media.duration_seconds % 60)).padStart(2, '0')}
          </div>
        )}
        {/* Play button overlay when paused */}
        {!isPlaying && isActive && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
              <Play className="w-7 h-7 text-white ml-1" fill="white" />
            </div>
          </div>
        )}
      </>
    );
  }

  // Image
  return (
    <div className="absolute inset-0 w-full h-full">
      {/* Shimmer base layer */}
      {!isLoaded && !imageError && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {!imageError ? (
        <img
          src={media.media_url}
          alt=""
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            isLoaded ? "opacity-100" : "opacity-0"
          )}
          loading={isPriorityItem ? "eager" : "lazy"}
          fetchPriority={isPriorityItem ? "high" : "auto"}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <Camera className="w-6 h-6 text-gray-300" />
        </div>
      )}
    </div>
  );
});

interface TaggedPostCardProps {
  post: TaggedPost;
  canManage?: boolean;
  onHide?: (postId: string) => void;
  isVideoReady?: boolean;
  onReady?: (postId: string) => void;
}

const TaggedPostCard = React.memo(function TaggedPostCard({
  post,
  canManage = false,
  onHide,
  isVideoReady = false,
  onReady,
}: TaggedPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const hasReportedReadyRef = useRef(false);

  // Get all media items
  const mediaItems = useMemo(() => post.post_media || [], [post.post_media]);
  const hasMultipleMedia = mediaItems.length > 1;
  const primaryMedia = mediaItems[0];
  const isVideo = primaryMedia?.media_type === 'video';

  // Review/course data from extended post type
  const isReview = !!(post as any).isReview;
  const reviewRating = (post as any).reviewRating as number | null;
  const golfCourse = (post as any).golfCourse as { id: string; name: string; country: string; sub_country?: string; region?: string } | undefined;
  const courseLocation = (post as any).courseLocation as string | null;

  const { likesCount, commentsCount } = usePostEngagement(post.id);

  const author = post.user_profiles;
  const authorName = author?.display_name || author?.username || 'Golfer';
  const authorAvatar = author?.profile_photo_url;

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: false })
    .replace('about ', '')
    .replace(' days', 'd')
    .replace(' day', 'd')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' weeks', 'w')
    .replace(' week', 'w')
    .replace(' months', 'mo')
    .replace(' month', 'mo');

  // Parse out the "Played at" line and get clean content
  const { cleanContent, courseName: parsedCourseName, regionText } = useMemo(
    () => parsePlayedAtFromContent(post.content),
    [post.content]
  );

  // Use golfCourse data if available, otherwise fall back to parsed content
  const displayCourseName = golfCourse?.name ?? parsedCourseName;
  const displayCourseLocation = courseLocation ?? regionText;
  
  // Truncate content if longer than 150 chars
  const shouldTruncate = cleanContent.length > 150 && !isExpanded;
  const displayContent = shouldTruncate ? cleanContent.slice(0, 150) : cleanContent;

  // Transform post_tags into TaggedText format
  const tags = useMemo(() => {
    return (post.post_tags || [])
      .filter(tag => tag.taggable_entities && tag.start_index !== null && tag.end_index !== null)
      .map(tag => ({
        id: tag.id,
        entity_type: tag.taggable_entities!.entity_type,
        entity_id: tag.taggable_entities!.entity_id,
        name: tag.taggable_entities!.username || tag.taggable_entities!.name,
        start_index: tag.start_index!,
        end_index: tag.end_index!,
      }));
  }, [post.post_tags]);

  // Calculate dynamic aspect ratio from first media
  const aspectRatio = useMemo(() => getAspectRatio(primaryMedia), [primaryMedia]);

  // Reset ready flag when post changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setActiveMediaIndex(0);
  }, [post.id]);

  // Handle video ready
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current && isVideo) {
      hasReportedReadyRef.current = true;
      console.log(`[TaggedPostCard] Video ${post.id.substring(0, 8)} ready (canplaythrough)`);
      onReady?.(post.id);
    }
  }, [post.id, isVideo, onReady]);

  // TikTok-level: 50% start / 10% stop hysteresis autoplay
  useEffect(() => {
    if (!cardRef.current || !isVideo) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        const ratio = entry.intersectionRatio;
        
        setShouldPlay(prev => {
          if (!prev && ratio >= 0.5) return true;
          if (prev && ratio < 0.1) return false;
          return prev;
        });
      },
      { threshold: [0, 0.1, 0.5, 1.0] }
    );
    
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [isVideo]);

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

  const handleComment = useCallback(() => {
    setCommentsOpen(true);
  }, []);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/clubhouse/post/${post.id}`);
    toast.success('Copied to clipboard');
  }, [post.id]);

  const handleSend = useCallback(async () => {
    const url = `${window.location.origin}/clubhouse/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: authorName, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Copied to clipboard');
    }
  }, [post.id, authorName]);

  const handleHide = useCallback(() => {
    onHide?.(post.id);
  }, [post.id, onHide]);

  const handleReport = useCallback(() => {
    toast.info('Report functionality coming soon');
  }, []);

  return (
    <>
      <div
        ref={cardRef}
        className="bg-card overflow-hidden border-x border-border/40"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
      >
        {/* Header - author info */}
        <div className="flex items-start gap-3" style={{ padding: '12px 16px 8px 16px' }}>
          <div className="flex-shrink-0">
            <SquircleAvatar
              size={40}
              src={authorAvatar || undefined}
              alt={authorName}
              fallback={authorName.charAt(0)}
              hideRing
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm leading-tight truncate">
              {authorName}
            </p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
              {timeAgo}
            </p>
          </div>

          {/* Actions menu */}
          <div className="flex-shrink-0 self-start">
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
                {canManage && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleHide}>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Hide from Tagged
                    </DropdownMenuItem>
                  </>
                )}
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
        {cleanContent && (
          <div style={{ padding: '0 16px 6px 16px' }}>
            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              <TaggedText text={displayContent} tags={tags} />
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

        {/* Course Location Bar - Reviews: stacked layout with breathing room */}
        {isReview && golfCourse && (
          <div 
            className="flex items-start gap-2 pointer-events-none mt-3"
            style={{ padding: '0 16px 12px 16px' }}
          >
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-foreground text-[13px] leading-tight truncate">{golfCourse.name}</span>
              {displayCourseLocation && (
                <span className="text-muted-foreground text-xs leading-tight truncate">{displayCourseLocation}</span>
              )}
            </div>
          </div>
        )}

        {/* Course Tag - Regular posts (non-review): same stacked layout */}
        {!isReview && displayCourseName && (
          <div 
            className="flex items-start gap-2 pointer-events-none mt-3"
            style={{ padding: '0 16px 12px 16px' }}
          >
            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-foreground text-[13px] leading-tight truncate">{displayCourseName}</span>
              {displayCourseLocation && (
                <span className="text-muted-foreground text-xs leading-tight truncate">{displayCourseLocation}</span>
              )}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-border/30 mx-4" />

        {/* Media - Full Width with dynamic aspect ratio */}
        {primaryMedia && (
          <div
            className="relative w-full overflow-hidden bg-muted"
            style={{ aspectRatio }}
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
                        isPlaying={shouldPlay}
                        isPriorityItem={idx === 0}
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
              // Single media item
              <MediaItem
                media={primaryMedia}
                isActive={true}
                isPlaying={shouldPlay}
                isPriorityItem={true}
                onVideoReady={handleCanPlayThrough}
                playerRef={playerRef}
              />
            )}

            {/* Review Indicators */}
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

            {/* Text overlays from studio_edits */}
            {(primaryMedia as any)?.studio_edits?.textOverlays?.length > 0 && (
              <TextOverlayRenderer
                textOverlays={(primaryMedia as any).studio_edits.textOverlays}
                isEditable={false}
              />
            )}

          </div>
        )}

        {/* Social proof */}
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
          postId={post.id}
          onOpenComments={handleComment}
          shareTitle={authorName}
        />
      </div>

      <CommentsSheet
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        postId={post.id}
        videoThumbnail={primaryMedia?.media_url || undefined}
        aspectRatio={aspectRatio}
        isReview={isReview}
        creatorName={authorName}
        creatorAvatar={authorAvatar || undefined}
        theme="grey"
        likesCount={likesCount}
      />
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.content === nextProps.post.content &&
    prevProps.post.post_media?.length === nextProps.post.post_media?.length &&
    prevProps.post.post_media?.[0]?.media_url === nextProps.post.post_media?.[0]?.media_url &&
    prevProps.canManage === nextProps.canManage &&
    prevProps.isVideoReady === nextProps.isVideoReady
  );
});

export default TaggedPostCard;
