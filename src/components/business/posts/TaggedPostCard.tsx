/**
 * TaggedPostCard - Card for posts by others that tag this business
 * Similar to BusinessPostCard but shows author info instead of business
 * 
 * UNIFIED WITH CLUBHOUSE: Uses visibility-based autoplay via IntersectionObserver
 * - managedByMediaRuntime={false} for direct browser-led autoplay
 * - autoplay based on 40% visibility threshold
 * - preload="auto" for instant buffering
 */
import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { TaggedPost } from '@/hooks/useBusinessTaggedPosts';
import { MoreHorizontal, Play, EyeOff, Flag, Copy, Share2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { getStreamPoster, getStreamIdFromUrl } from '@/utils/stream';
import { UnifiedVideoPlayer, UnifiedVideoPlayerRef } from '@/media/components/UnifiedVideoPlayer';
import { generateStreamHlsUrl } from '@/config/cloudflareStream';
import CommentsPage from '@/components/clubhouse/cinematic/CommentsPage';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { PostActionBar } from '@/components/posts/PostActionBar';
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
  const playerRef = useRef<UnifiedVideoPlayerRef>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hasReportedReadyRef = useRef(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const primaryMedia = post.post_media?.[0];
  const isVideo = primaryMedia?.media_type === 'video';
  const hasMultipleMedia = (post.post_media?.length || 0) > 1;

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

  // Get video HLS URL
  const streamId = isVideo ? getStreamIdFromUrl(primaryMedia?.media_url || '') : null;
  const hlsUrl = streamId ? generateStreamHlsUrl(streamId) : null;
  const thumbnailUrl = isVideo
    ? primaryMedia?.poster_url || getStreamPoster(primaryMedia?.media_url || '', '1s', 600)
    : primaryMedia?.media_url;

  // Reset ready flag when post changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
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
        await navigator.share({ title: authorName, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
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
        className="bg-white overflow-hidden border-x border-border/40"
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
                courseId={(post as any).course_id}
                courseName={courseName}
                regionText={regionText}
                className={cleanContent ? 'mt-2' : ''}
              />
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-border/30 mx-4" />

        {/* Media - PAUSED VIDEO FIRST ARCHITECTURE */}
        {primaryMedia && (
          <div
            className="relative w-full overflow-hidden flex justify-center items-center"
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
                <div className={cn(
                  "absolute inset-0 w-full h-full transition-opacity duration-150 ease-out",
                  isVideoReady ? "opacity-100" : "opacity-0"
                )}>
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
                    onCanPlayThrough={handleCanPlayThrough}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Play button overlay when paused and ready */}
                {isVideoReady && !isVisible && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-black/50 flex items-center justify-center backdrop-blur-sm">
                      <Play className="w-7 h-7 text-white ml-1" fill="white" />
                    </div>
                  </div>
                )}
              </>
            ) : isVideo ? (
              <div className="relative w-full h-full bg-muted">
                <img 
                  src={thumbnailUrl || ''} 
                  alt="" 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.onerror = null;
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white ml-1" fill="white" />
                  </div>
                </div>
              </div>
            ) : (
              <img
                src={primaryMedia.media_url}
                alt=""
                className="w-full max-w-full h-auto object-cover"
                style={{ maxHeight: '500px' }}
              />
            )}

            {/* Text overlays from studio_edits */}
            {(primaryMedia as any)?.studio_edits?.textOverlays?.length > 0 && (
              <TextOverlayRenderer
                textOverlays={(primaryMedia as any).studio_edits.textOverlays}
                isEditable={false}
              />
            )}

            {/* Achievement Badges Overlay - Top Left */}
            <AchievementBadgesOverlay badgeIds={post.badges} className="top-2 left-2" />

            {hasMultipleMedia && (
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
                +{post.post_media!.length - 1}
              </div>
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
        creatorName={authorName}
        creatorAvatar={authorAvatar || undefined}
        theme="grey"
      />
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.content === nextProps.post.content &&
    prevProps.post.post_media?.[0]?.media_url === nextProps.post.post_media?.[0]?.media_url &&
    prevProps.canManage === nextProps.canManage &&
    prevProps.isVideoReady === nextProps.isVideoReady
  );
});

export default TaggedPostCard;
