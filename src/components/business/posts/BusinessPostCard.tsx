/**
 * BusinessPostCard - Premium post tile with action bar
 * Full-width tile with subtle elevation on gradient background
 * Action bar: Like / Comment / Reshare / Send (via global PostActionBar)
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
} from 'lucide-react';
import { formatTimeAgo } from '@/utils/formatTime';
import { cn } from '@/lib/utils';
import { getStreamPoster, getStreamIdFromUrl } from '@/utils/stream';
import { HLSPlayer, HLSPlayerRef } from '@/media';
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
import { RegisterMediaFn } from '@/media';
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
  registerVideo?: RegisterMediaFn;
  isPlaying?: boolean;
  videoIndex?: number;
}

export default function BusinessPostCard({
  post,
  businessId,
  businessName,
  businessLogo,
  followerCount = 0,
  canManage = false,
  registerVideo,
  isPlaying,
  videoIndex = 0,
}: BusinessPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [pinPickerOpen, setPinPickerOpen] = useState(false);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const playerRef = useRef<HLSPlayerRef>(null);
  const cardRef = useRef<HTMLDivElement>(null); // Sentinel for IntersectionObserver
  
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

  // Register video for autoplay (ALL videos for business, not every 3rd)
  // Uses cardRef as observeTarget so IntersectionObserver observes the full card, not the video element
  useEffect(() => {
    if (!isVideo || !registerVideo) return;
    
    const checkAndRegister = () => {
      const el = playerRef.current?.getElement();
      const cardEl = cardRef.current;
      if (!el || !cardEl) return;
      
      registerVideo({
        id: post.id,
        element: el,
        observeTarget: cardEl, // Observe the card wrapper, not the video element
        isCandidate: true,
        sortIndex: videoIndex,
      });
    };

    checkAndRegister();
    const retryTimer = setTimeout(checkAndRegister, 100);

    return () => {
      clearTimeout(retryTimer);
      registerVideo({
        id: post.id,
        element: null,
        observeTarget: null, // Explicit cleanup
        isCandidate: true,
        sortIndex: videoIndex,
      });
    };
  }, [isVideo, registerVideo, post.id, videoIndex]);

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

  const handleDeletePost = useCallback(() => {
    toast.info('Delete post coming soon');
  }, []);

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

        {/* Media - centered with safety net */}
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
                {/* Filtered + rotated pixel layer */}
                <div className={cn("absolute inset-0 w-full h-full", filterClass)} style={pixelStyle}>
                  <HLSPlayer
                    ref={playerRef}
                    src={hlsUrl}
                    autoplay={isPlaying}
                    muted
                    loop
                    externallyManaged
                    onLoadedData={() => {
                      const el = playerRef.current?.getElement();
                      if (el) setVideoEl(el);
                    }}
                    className="w-full h-full object-cover max-w-full"
                  />
                </div>
                {/* Video scrubber - positioned at bottom of media - OUTSIDE filtered layer */}
                {videoEl && (
                  <VideoScrubber videoEl={videoEl} height={3} />
                )}
              </>
            ) : isVideo ? (
              <div className={cn("relative w-full h-full bg-muted", filterClass)} style={pixelStyle}>
                <img src={thumbnailUrl || ''} alt="" className="w-full h-full object-cover" />
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

        {/* Action bar - global canonical component */}
        <PostActionBar
          postId={post.id}
          onOpenComments={handleComment}
          shareTitle={businessName}
        />
      </div>

      {/* Comments - use Clubhouse slide-in panel with grey theme */}
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
        isReview={(post as any).categories?.includes('review')}
        creatorName={businessName}
        creatorAvatar={businessLogo || undefined}
        theme="grey"
      />

      {/* Insights Modal */}
      <PostInsightsModal
        isOpen={insightsOpen}
        onClose={() => setInsightsOpen(false)}
        postId={post.id}
      />

      {/* Pin Duration Picker */}
      <PinDurationPicker
        isOpen={pinPickerOpen}
        onClose={() => setPinPickerOpen(false)}
        onSelect={(duration) => pin(post.id, duration)}
      />
    </>
  );
}

