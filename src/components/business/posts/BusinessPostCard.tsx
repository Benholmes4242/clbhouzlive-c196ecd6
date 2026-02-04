/**
 * BusinessPostCard - Premium post tile with action bar
 * Full-width tile with subtle elevation on gradient background
 * Action bar: Like / Comment / Reshare / Send (via global PostActionBar)
 * 
 * UNIFIED WITH CLUBHOUSE: Uses visibility-based autoplay via IntersectionObserver
 * - managedByMediaRuntime={false} for direct browser-led autoplay
 * - autoplay based on 40% visibility threshold
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
} from 'lucide-react';
import { formatTimeAgo } from '@/utils/formatTime';
import { cn } from '@/lib/utils';
import { getStreamPoster, getStreamIdFromUrl } from '@/utils/stream';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { getFilterClass } from '@/utils/studioFilters';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
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
import PlayedAtLine from '@/components/posts/PlayedAtLine';
import TextOverlayRenderer from '@/components/studio/TextOverlayRenderer';
import { AchievementBadgesOverlay } from '@/components/post/badges/AchievementBadgesOverlay';
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
  const [isVisible, setIsVisible] = useState(false);
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const cardRef = useRef<HTMLDivElement>(null); // Sentinel for IntersectionObserver
  const [shouldPlay, setShouldPlay] = useState(false);
  const hasReportedReadyRef = useRef(false);
  
  const { pin, unpin, isPinning } = usePinPost(businessId);
  const isPinned = post.is_pinned && (!post.pinned_until || new Date(post.pinned_until) > new Date());
  
  const primaryMedia = post.post_media?.[0];
  const isVideo = primaryMedia?.media_type === 'video';
  const hasMultipleMedia = (post.post_media?.length || 0) > 1;

  // Engagement data for social proof line (like/comment actions handled by PostActionBar)
  const { likesCount, commentsCount } = usePostEngagement(post.id);

  // Format timestamp using unified utility
  const timeAgo = formatTimeAgo(post.created_at, 'short');

  // Parse out the "Played at" line and get clean content
  const { cleanContent, courseName, regionText } = useMemo(
    () => parsePlayedAtFromContent(post.content),
    [post.content]
  );
  
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

  // Get video HLS URL and poster
  const streamId = isVideo ? getStreamIdFromUrl(primaryMedia?.media_url || '') : null;
  const hlsUrl = streamId ? generateStreamHlsUrl(streamId) : null;
  const thumbnailUrl = isVideo
    ? primaryMedia?.poster_url || getStreamPoster(primaryMedia?.media_url || '', '1s', 600)
    : primaryMedia?.media_url;
  
  // Get filter class and edit styles for studio edits
  const studioEdits = (primaryMedia as any)?.studio_edits;
  const filterId = (primaryMedia as any)?.filter_id ?? studioEdits?.filter ?? null;
  const filterClass = getFilterClass(filterId);
  const cropClass = getCropWrapperClass(studioEdits?.crop);
  const pixelStyle = getPixelLayerStyle(studioEdits);

  // Reset ready flag when post changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
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
        setIsVisible(entry.isIntersecting && ratio >= 0.5);
      },
      { threshold: [0, 0.1, 0.5, 1.0] }
    );
    
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [isVideo]);

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
      // Trigger a refetch by invalidating queries
      const { useQueryClient } = await import('@tanstack/react-query');
      // Note: The feed will auto-refetch on focus or we rely on parent to handle
      window.location.reload(); // Simple approach - reload to refresh feed
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
        {(cleanContent || courseName) && (
          <div style={{ padding: '0 16px 10px 16px' }}>
            {cleanContent && (
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
            )}
            {/* Played At line with clickable course name */}
            {courseName && (
              <PlayedAtLine
                courseId={post.course_id}
                courseName={courseName}
                regionText={regionText}
                className={cleanContent ? 'mt-2' : ''}
              />
            )}
          </div>
        )}

        {/* Subtle divider under header/caption before media */}
        <div className="h-px bg-border/30 mx-4" />

        {/* Media - centered with safety net - PAUSED VIDEO FIRST ARCHITECTURE */}
        {primaryMedia && (
          <div
            className={cn("relative w-full overflow-hidden flex justify-center items-center", cropClass)}
            style={{
              aspectRatio: isVideo ? '16 / 9' : undefined,
              maxHeight: isVideo ? undefined : '500px',
              minWidth: 0,
            }}
          >
            {isVideo && hlsUrl ? (
              <>
                {/* Poster-first: priority loading for visible tiles */}
                {thumbnailUrl && (
                  <img
                    src={thumbnailUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.onerror = null;
                    }}
                  />
                )}

                {/* UnifiedVideoPlayer - 150ms crossfade */}
                <div 
                  className={cn(
                    "absolute inset-0 w-full h-full transition-opacity duration-150 ease-out",
                    filterClass,
                    isVideoReady ? "opacity-100" : "opacity-0"
                  )} 
                  style={pixelStyle}
                >
                  <UnifiedVideoPlayer
                    ref={playerRef}
                    src={hlsUrl}
                    posterUrl={thumbnailUrl || undefined}
                    autoplay={shouldPlay}
                    muted
                    loop
                    managedByMediaRuntime={false}
                    preload="auto"
                    surface="grid"
                    onLoadedData={() => {
                      const el = playerRef.current?.getVideoElement();
                      if (el) setVideoEl(el);
                    }}
                    onCanPlayThrough={handleCanPlayThrough}
                    className="w-full h-full object-cover max-w-full"
                  />
                </div>

                {/* Skeleton - only before video is buffered */}
                {!isVideoReady && (
                  <div className="absolute inset-0 bg-muted flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer-down" />
                    <Loader2 className="w-8 h-8 animate-spin text-muted-foreground/50" />
                  </div>
                )}

                {/* Video scrubber - positioned at bottom of media - OUTSIDE filtered layer */}
                {videoEl && isVideoReady && (
                  <VideoScrubber videoEl={videoEl} height={3} />
                )}
              </>
            ) : isVideo ? (
              <div className={cn("relative w-full h-full bg-muted", filterClass)} style={pixelStyle}>
                <img 
                  src={thumbnailUrl || ''} 
                  alt="" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.onerror = null;
                  }}
                />
                {/* Play button overlay - OUTSIDE filtered layer */}
              </div>
            ) : (
              <div className={cn("w-full h-full", filterClass)} style={pixelStyle}>
                <img
                  src={primaryMedia.media_url}
                  alt=""
                  className="w-full max-w-full h-auto object-cover"
                  style={{ maxHeight: '500px' }}
                />
              </div>
            )}

            {/* Play button overlay for video poster - OUTSIDE filtered layer */}
            {isVideo && !hlsUrl && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
                  <Play className="h-8 w-8 text-white ml-1" fill="white" />
                </div>
              </div>
            )}

            {/* Play button overlay when paused and ready */}
            {isVideo && hlsUrl && isVideoReady && !isVisible && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                  <Play className="w-7 h-7 text-white ml-1" fill="white" />
                </div>
              </div>
            )}

            {/* Text overlays from studio_edits - OUTSIDE filtered layer */}
            {(primaryMedia as any)?.studio_edits?.textOverlays?.length > 0 && (
              <TextOverlayRenderer
                textOverlays={(primaryMedia as any).studio_edits.textOverlays}
                isEditable={false}
              />
            )}

            {/* Achievement Badges Overlay - Top Left */}
            <AchievementBadgesOverlay badgeIds={post.badges} className="top-2 left-2" />

            {/* Multiple media indicator */}
            {hasMultipleMedia && (
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                +{post.post_media!.length - 1}
              </div>
            )}
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
        videoThumbnail={thumbnailUrl || undefined}
        aspectRatio={(() => {
          const media = primaryMedia as any;
          if (media?.aspect_ratio) return media.aspect_ratio;
          if (media?.width && media?.height) return media.width / media.height;
          return undefined;
        })()}
        isReview={!!(post as any).source_review_id}
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
    prevProps.post.post_media?.[0]?.media_url === nextProps.post.post_media?.[0]?.media_url &&
    prevProps.isVideoReady === nextProps.isVideoReady &&
    prevProps.canManage === nextProps.canManage &&
    prevProps.followerCount === nextProps.followerCount
  );
});

export default BusinessPostCard;
