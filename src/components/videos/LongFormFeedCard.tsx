/**
 * LongFormFeedCard - Full-width feed card for long-form videos
 * 
 * ALIGNED WITH COMMUNITYFEEDCARD: Uses the exact same patterns for
 * aspect ratio, course location tags, review indicators, and styling.
 * 
 * INSTANT VIDEO PATTERN:
 * - Uses managedByMediaRuntime={false}, externallyManaged={false}
 * - Uses autoplay based on visibility (IntersectionObserver)
 * - Uses preload="auto" for instant buffering
 * - Direct browser-led autoplay (no MediaRuntime manual control)
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { MoreHorizontal, MapPin, Play, Copy, Share2, Flag, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { PostActionBar } from '@/components/posts/PostActionBar';
import { RatingPill } from '@/components/ui/RatingPill';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { formatTimeAgo } from '@/utils/formatTime';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { UnifiedVideoPlayer } from '@/media';
import { uidFromNode } from '@/utils/cloudflareStreamTransform';
import { generateStreamHlsUrl, generateStreamThumbnailUrl } from '@/config/cloudflareStream';
import { isPosterFailed } from '@/utils/posterPrefetch';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import CommentsPage from '@/components/clubhouse/cinematic/CommentsPage';

// Helper to remove the "📍 Played at" line from content (matches CommunityFeedCard)
function removePlayedAtLine(content: string | null): string {
  if (!content) return '';
  const playedAtRegex = /\n*📍\s*Played at\s+[^\n]+\n*/gi;
  return content.replace(playedAtRegex, '').trim();
}

export interface LongFormFeedVideo {
  id: string;
  title?: string;
  caption?: string;
  content?: string;
  mediaUrl: string;
  thumbnailUrl?: string;
  duration?: string;
  durationSeconds?: number;
  creatorUserId: string;
  creatorName: string;
  creatorUsername?: string;
  creatorAvatarUrl?: string;
  followerCount?: number;
  golfCourseName?: string;
  golfCourseId?: string;
  createdAt: string;
  // Review fields
  isReview?: boolean;
  reviewRating?: number | null;
  // Golf course with location details
  golfCourse?: {
    id: string;
    name: string;
    country?: string | null;
    region?: string | null;
    sub_country?: string | null;
  } | null;
  // Media dimensions for dynamic aspect ratio
  mediaWidth?: number | null;
  mediaHeight?: number | null;
}

interface LongFormFeedCardProps {
  video: LongFormFeedVideo;
  onVideoTap: () => void;
  onCreatorTap?: () => void;
  className?: string;
  /** Index in list - first 6 get priority loading */
  index?: number;
}

export const LongFormFeedCard = React.memo(function LongFormFeedCard({ 
  video, 
  onVideoTap, 
  onCreatorTap,
  className,
  index = 0,
}: LongFormFeedCardProps) {
  const navigate = useNavigate();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  
  // Video refs
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const hasReportedReadyRef = useRef(false);
  const isPriority = index < 6;

  // P0: TikTok-level 50% start / 10% stop hysteresis autoplay
  useEffect(() => {
    const element = videoContainerRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const ratio = entries[0]?.intersectionRatio ?? 0;
        // Hysteresis: 50% to start, 10% to stop (prevents jitter)
        setShouldPlay(prev => {
          if (!prev && ratio >= 0.5) return true;
          if (prev && ratio < 0.1) return false;
          return prev;
        });
      },
      { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  // Engagement data
  const { likesCount, commentsCount } = usePostEngagement(video.id);

  // Format timestamp - only timeAgo, no follower count (matches Friends tab)
  const timeAgo = formatTimeAgo(video.createdAt, 'short');

  // Caption text - clean out "📍 Played at" line (matches CommunityFeedCard)
  const rawCaption = video.title || video.caption || video.content || '';
  const captionText = useMemo(() => removePlayedAtLine(rawCaption), [rawCaption]);
  const shouldTruncate = captionText.length > 150 && !isExpanded;
  const displayContent = shouldTruncate ? captionText.slice(0, 150) : captionText;

  // Dynamic aspect ratio calculation (matches CommunityFeedCard)
  const aspectRatio = useMemo(() => {
    const width = video.mediaWidth || 16;
    const height = video.mediaHeight || 9;
    const rawRatio = width / height;
    // Clamp to reasonable bounds: 0.8 (4:5 portrait) to 2.0 (2:1 landscape)
    return Math.max(0.8, Math.min(2.0, rawRatio));
  }, [video.mediaWidth, video.mediaHeight]);

  // Course location string (matches CommunityFeedCard)
  const courseLocation = useMemo(() => {
    if (!video.golfCourse) return null;
    const parts = [
      video.golfCourse.region || video.golfCourse.sub_country, 
      video.golfCourse.country
    ].filter(Boolean);
    return parts.join(', ');
  }, [video.golfCourse]);

  // CRITICAL: Extract stream UID for cache consistency
  const { hlsUrl, streamId, posterUrl } = useMemo(() => {
    if (!video.mediaUrl) return { hlsUrl: null, streamId: video.id, posterUrl: video.thumbnailUrl };
    const extractedStreamId = uidFromNode({ src: video.mediaUrl });
    const generatedPosterUrl = extractedStreamId 
      ? generateStreamThumbnailUrl(extractedStreamId, { height: 720, fit: 'cover' }) 
      : undefined;
    const finalPosterUrl = generatedPosterUrl && !isPosterFailed(generatedPosterUrl) 
      ? generatedPosterUrl 
      : video.thumbnailUrl;
    return {
      hlsUrl: extractedStreamId ? generateStreamHlsUrl(extractedStreamId) : null,
      streamId: extractedStreamId || video.id,
      posterUrl: finalPosterUrl,
    };
  }, [video.mediaUrl, video.id, video.thumbnailUrl]);

  // Reset ready flag when video changes
  useEffect(() => {
    hasReportedReadyRef.current = false;
    setIsVideoReady(false);
  }, [video.id]);

  const handleComment = useCallback(() => {
    setCommentsOpen(true);
  }, []);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/clubhouse/post/${video.id}`);
    toast.success('Link copied');
  }, [video.id]);

  const handleSend = useCallback(async () => {
    const url = `${window.location.origin}/clubhouse/post/${video.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: video.title || 'Video', url });
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  }, [video.id, video.title]);

  const handleReport = useCallback(() => {
    toast.info('Report functionality coming soon');
  }, []);

  const handleCourseTap = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (video.golfCourseId) {
      navigate(`/courses/${video.golfCourseId}`);
    }
  }, [video.golfCourseId, navigate]);

  // Determine if this is a review post
  const isReview = !!video.isReview;
  const reviewRating = video.reviewRating;
  const golfCourse = video.golfCourse || (video.golfCourseName ? { 
    id: video.golfCourseId || '', 
    name: video.golfCourseName, 
    country: null, 
    region: null, 
    sub_country: null 
  } : null);

  return (
    <>
      <div
        className={cn(
          "rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm",
          className
        )}
        data-video-card-id={video.id}
      >
        {/* Header - 3 column layout: avatar / meta / actions - matches Friends tab padding */}
        <div 
          className="flex items-start gap-3 cursor-pointer" 
          style={{ padding: '10px 16px 6px 16px' }}
          onClick={onCreatorTap}
        >
          {/* Left: Avatar */}
          <div className="flex-shrink-0">
            <SquircleAvatar
              size={40}
              src={video.creatorAvatarUrl}
              alt={video.creatorName}
              fallback={video.creatorName?.charAt(0) || '?'}
              hideRing
            />
          </div>

          {/* Middle: Meta - time only, no follower count (matches Friends tab) */}
          <div className="flex-1 min-w-0">
           <p className="font-semibold text-sm text-gray-900 leading-tight truncate">
              {video.creatorName}
            </p>
            <p className="text-xs text-gray-400 leading-tight truncate">
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

        {/* Caption - matches Friends tab padding and styling */}
        {captionText && (
          <div style={{ padding: '0 16px 6px 16px' }}>
          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {displayContent}
              {shouldTruncate && (
                <>
                  {'... '}
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="text-emerald-600 font-medium hover:underline"
                  >
                    more
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Course Location Bar - Stacked MapPin format (matches CommunityFeedCard) */}
        {golfCourse && (
          <div 
            className="flex items-start gap-2 mt-3 cursor-pointer"
            style={{ padding: '0 16px 12px 16px' }}
            onClick={handleCourseTap}
          >
            <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-gray-700 text-[13px] leading-tight truncate">
                {golfCourse.name}
              </span>
              {courseLocation && (
                <span className="text-gray-500 text-xs leading-tight truncate">
                  {courseLocation}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gray-100 mx-4" />

        {/* Media Section - Dynamic aspect ratio (matches CommunityFeedCard) */}
        <div 
          ref={videoContainerRef}
          className="relative w-full cursor-pointer bg-muted overflow-hidden will-change-transform"
          style={{ aspectRatio }}
          onClick={onVideoTap}
        >
          {/* P1: Priority poster loading for first 6 items */}
          {posterUrl && (
            <img
              src={posterUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              loading={isPriority ? "eager" : "lazy"}
              fetchPriority={isPriority ? "high" : "auto"}
              decoding="async"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}

          {hlsUrl ? (
            <>
              {/* 
                TikTok-Level: UnifiedVideoPlayer with source stability + pool promotion
                - 150ms crossfade (ease-out)
                - Hysteresis autoplay from IntersectionObserver
              */}
              <div 
                className={cn(
                  "absolute inset-0 transition-opacity duration-150 ease-out",
                  isVideoReady ? "opacity-100" : "opacity-0"
                )}
                aria-busy={!isVideoReady}
              >
                <UnifiedVideoPlayer
                  src={hlsUrl}
                  posterUrl={posterUrl}
                  autoplay={shouldPlay}
                  muted
                  loop
                  preload="auto"
                  objectFit="cover"
                  mediaId={streamId}
                  className="absolute inset-0 w-full h-full object-cover"
                  onCanPlayThrough={() => {
                    if (!hasReportedReadyRef.current) {
                      hasReportedReadyRef.current = true;
                      setIsVideoReady(true);
                    }
                  }}
                />
              </div>
              
              {/* Skeleton/Loading state - only shown BEFORE video has buffered */}
              {!isVideoReady && !posterUrl && (
                <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              )}
              
              {/* Play button overlay - shown when video is ready but paused */}
              {isVideoReady && !shouldPlay && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full backdrop-blur-md bg-black/35 border border-white/10 flex items-center justify-center">
                    <Play className="h-8 w-8 text-white ml-1" fill="white" />
                  </div>
                </div>
              )}
            </>
          ) : !posterUrl && (
            /* Fallback for invalid video */
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <Play className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}
          
          {/* Review Indicators (matches CommunityFeedCard) */}
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

          {/* Duration Badge */}
          {video.duration && (
            <div className="absolute bottom-3 right-3 px-2 py-0.5 backdrop-blur-sm bg-black/60 rounded-md text-white text-xs font-medium tabular-nums">
              {video.duration}
            </div>
          )}
        </div>

        {/* Social proof line */}
        {(likesCount > 0 || commentsCount > 0) && (
          <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100">
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
          postId={video.id}
          onOpenComments={handleComment}
          shareTitle={video.title || video.creatorName}
        />
      </div>

      {/* Comments Drawer */}
      <CommentsPage
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        postId={video.id}
        videoThumbnail={video.thumbnailUrl}
        aspectRatio={aspectRatio}
        creatorName={video.creatorName}
        creatorAvatar={video.creatorAvatarUrl}
        theme="grey"
      />
    </>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memoization
  return (
    prevProps.video.id === nextProps.video.id &&
    prevProps.video.mediaUrl === nextProps.video.mediaUrl &&
    prevProps.video.title === nextProps.video.title &&
    prevProps.video.caption === nextProps.video.caption &&
    prevProps.video.creatorName === nextProps.video.creatorName &&
    prevProps.video.creatorAvatarUrl === nextProps.video.creatorAvatarUrl &&
    prevProps.video.isReview === nextProps.video.isReview &&
    prevProps.video.reviewRating === nextProps.video.reviewRating &&
    prevProps.className === nextProps.className
  );
});

export default LongFormFeedCard;
