/**
 * BusinessPostCard - Premium post tile with action bar
 * Full-width tile with subtle elevation on gradient background
 * Action bar: Like / Comment / Reshare / Send (via global PostActionBar)
 * 
 * UNIFIED WITH CLUBHOUSE: Uses visibility-based autoplay via IntersectionObserver
 * - Dynamic aspect ratio (0.8-2.0 clamping)
 * - Multi-media carousel with chevrons + dots
 * - Review indicators (Review pill, rating pill, course bar)
 * - managedByMediaRuntime={false} for direct browser-led autoplay
 * - autoplay based on 50% start / 10% stop hysteresis
 * - preload="auto" for instant buffering
 */

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { BusinessPost } from '@/hooks/useBusinessPosts';
import {
  MoreHorizontal,
  Play,
  Copy,
  Share2,
  Pencil,
  Eye,
  Pin,
  PinOff,
  BarChart2,
  Trash2,
  Loader2,
  MapPin,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { formatTimeAgo } from '@/utils/formatTime';
import { cn } from '@/lib/utils';
import { getStreamPoster, getStreamIdFromUrl } from '@/utils/stream';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { getFilterClass } from '@/utils/studioFilters';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { getCropWrapperClass, getPixelLayerStyle } from '@/utils/studioEdit';
import CommentsPage from '@/components/clubhouse/cinematic/CommentsPage';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { PostActionBar } from '@/components/posts/PostActionBar';
import { usePinPost } from '@/hooks/usePinnedPost';
import { PostInsightsModal } from './PostInsightsModal';
import { PinDurationPicker } from './PinDurationPicker';
import { toast } from 'sonner';
import TaggedText from '@/components/posts/TaggedText';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { AchievementBadgesOverlay } from '@/components/post/badges/AchievementBadgesOverlay';
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

import { VideoScrubber } from '@/components/video/VideoScrubber';

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
  filterClass: string;
  pixelStyle: React.CSSProperties;
  onVideoReady: () => void;
  playerRef?: React.RefObject<UnifiedVideoPlayerRef>;
}

const MediaItem = React.memo(function MediaItem({
  media,
  isActive,
  isPlaying,
  isPriorityItem,
  filterClass,
  pixelStyle,
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
        <div className={cn("absolute inset-0", filterClass)} style={pixelStyle}>
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
    <div className={cn("absolute inset-0 w-full h-full", filterClass)} style={pixelStyle}>
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

interface BusinessPostCardProps {
  post: BusinessPost;
  businessId: string;
  businessName?: string;
  businessLogo?: string | null;
  followerCount?: number;
  canManage?: boolean;
  isVideoReady?: boolean;
  onReady?: (postId: string) => void;
}

const BusinessPostCard = React.memo(function BusinessPostCard({
  post,
  businessId,
  businessName,
  businessLogo,
  followerCount = 0,
  canManage = false,
  isVideoReady = false,
  onReady,
}: BusinessPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [pinPickerOpen, setPinPickerOpen] = useState(false);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const hasReportedReadyRef = useRef(false);
  
  const { pin, unpin, isPinning } = usePinPost(businessId);
  const isPinned = post.is_pinned && (!post.pinned_until || new Date(post.pinned_until) > new Date());
  
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

  // Engagement data for social proof line (like/comment actions handled by PostActionBar)
  const { likesCount, commentsCount } = usePostEngagement(post.id);

  // Format timestamp using unified utility
  const timeAgo = formatTimeAgo(post.created_at, 'short');

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
  
  // Get filter class and edit styles for studio edits
  const studioEdits = (primaryMedia as any)?.studio_edits;
  const filterId = (primaryMedia as any)?.filter_id ?? studioEdits?.filter ?? null;
  const filterClass = getFilterClass(filterId);
  const cropClass = getCropWrapperClass(studioEdits?.crop);
  const pixelStyle = getPixelLayerStyle(studioEdits);

  // Reset ready flag when post changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setActiveMediaIndex(0);
  }, [post.id]);

  // Handle video ready (buffered for smooth playback)
  const handleCanPlayThrough = useCallback(() => {
    if (!hasReportedReadyRef.current && isVideo) {
      hasReportedReadyRef.current = true;
      console.log(`[BusinessPostCard] Video ${post.id.substring(0, 8)} ready (canplaythrough)`);
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
    toast.success('Link copied');
  }, [post.id]);

  const handleSend = useCallback(async () => {
    const url = `${window.location.origin}/clubhouse/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: businessName || 'Post', url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  }, [post.id, businessName]);

  const handleEditCaption = useCallback(() => {
    toast.info('Edit caption coming soon');
  }, []);

  const handleChangeVisibility = useCallback(() => {
    toast.info('Visibility settings coming soon');
  }, []);

  const handlePinToTop = useCallback(() => {
    if (isPinned) {
      unpin(post.id);
    } else {
      setPinPickerOpen(true);
    }
  }, [isPinned, post.id, unpin]);

  const handleViewInsights = useCallback(() => {
    setInsightsOpen(true);
  }, []);

  const handleDeletePost = useCallback(async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { error } = await supabase
        .from('posts')
        .update({ status: 'deleted' })
        .eq('id', post.id);
      
      if (error) throw error;
      
      toast.success('Post deleted');
      window.location.reload();
    } catch (err) {
      console.error('Delete post error:', err);
      toast.error('Failed to delete post');
    }
  }, [post.id]);

  return (
    <>
      {/* Post tile - full width with border gutter */}
      <div
        ref={cardRef}
        className={cn(
          "bg-white overflow-hidden border-x border-border/40",
          isPinned && "ring-1 ring-border/60"
        )}
        style={{
          boxShadow: isPinned ? '0 2px 8px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        {/* Pinned indicator - subtle pill */}
        {isPinned && (
          <div className="flex items-center gap-1.5 px-4 py-1.5 bg-muted/30 border-b border-border/30">
            <Pin className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Pinned</span>
          </div>
        )}
        {/* Post header - 3 column layout: avatar / meta / actions */}
        <div className="flex items-start gap-3" style={{ padding: '12px 16px 8px 16px' }}>
          {/* Left: Avatar (fixed) */}
          <div className="flex-shrink-0">
            <SquircleAvatar
              size={40}
              src={businessLogo || undefined}
              alt={businessName || 'Business'}
              fallback={businessName?.charAt(0) || 'B'}
              hideRing
            />
          </div>

          {/* Middle: Meta (flex-grow) */}
          <div className="flex-1 min-w-0">
            {/* Line 1: Name */}
            <p className="font-semibold text-foreground text-sm leading-tight truncate">
              {businessName || 'Business'}
            </p>
            {/* Line 2: Follower count + timestamp */}
            <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
              <span>{followerCount.toLocaleString()} followers</span>
              <span className="mx-1">·</span>
              <span>{timeAgo}</span>
            </p>
          </div>

          {/* Right: Actions (fixed) - Only show if viewer can manage */}
          {canManage && (
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
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleEditCaption}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit caption
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleChangeVisibility}>
                    <Eye className="h-4 w-4 mr-2" />
                    Change visibility
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePinToTop} disabled={isPinning}>
                    {isPinned ? <PinOff className="h-4 w-4 mr-2" /> : <Pin className="h-4 w-4 mr-2" />}
                    {isPinned ? 'Unpin' : 'Pin to top'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleViewInsights}>
                    <BarChart2 className="h-4 w-4 mr-2" />
                    View insights
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDeletePost} className="text-destructive focus:text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Caption block - consistent padding below header */}
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

        {/* Course Location Bar - Reviews: stacked layout with more spacing */}
        {isReview && golfCourse && (
          <div 
            className="flex items-start gap-2 pointer-events-none mt-2"
            style={{ padding: '0 16px 6px 16px' }}
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
            className="flex items-start gap-2 pointer-events-none"
            style={{ padding: '0 16px 6px 16px' }}
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

        {/* Subtle divider under header/caption before media */}
        <div className="h-px bg-border/30 mx-4" />

        {/* Media - Full Width with dynamic aspect ratio */}
        {primaryMedia && (
          <div
            className={cn("relative w-full overflow-hidden bg-muted", cropClass)}
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
                        filterClass={filterClass}
                        pixelStyle={pixelStyle}
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
                filterClass={filterClass}
                pixelStyle={pixelStyle}
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

            {/* Achievement Badges Overlay - Top Left */}
            {!isReview && <AchievementBadgesOverlay badgeIds={post.badges} className="top-2 left-2" />}
          </div>
        )}

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
          postId={post.id}
          onOpenComments={handleComment}
          shareTitle={businessName || 'Post'}
        />
      </div>

      {/* Pin duration picker */}
      <PinDurationPicker
        isOpen={pinPickerOpen}
        onClose={() => setPinPickerOpen(false)}
        onSelect={async (duration) => {
          await pin(post.id, duration);
          setPinPickerOpen(false);
        }}
      />

      {/* Post insights modal */}
      <PostInsightsModal
        isOpen={insightsOpen}
        onClose={() => setInsightsOpen(false)}
        postId={post.id}
      />

      {/* Comments drawer */}
      <CommentsPage
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        postId={post.id}
        videoThumbnail={primaryMedia?.media_url || undefined}
        aspectRatio={aspectRatio}
        isReview={isReview}
        creatorName={businessName || 'Business'}
        creatorAvatar={businessLogo || undefined}
        theme="grey"
      />
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.is_pinned === nextProps.post.is_pinned &&
    prevProps.post.pinned_until === nextProps.post.pinned_until &&
    prevProps.post.content === nextProps.post.content &&
    prevProps.post.post_media?.length === nextProps.post.post_media?.length &&
    prevProps.post.post_media?.[0]?.media_url === nextProps.post.post_media?.[0]?.media_url &&
    prevProps.isVideoReady === nextProps.isVideoReady &&
    prevProps.canManage === nextProps.canManage &&
    prevProps.followerCount === nextProps.followerCount
  );
});

export default BusinessPostCard;
