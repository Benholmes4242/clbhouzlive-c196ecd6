/**
 * LongFormFeedCard - Full-width feed card for long-form videos
 * 
 * CLUBHOUSE PARITY: Uses MediaRuntime registration, play-gated transitions,
 * shimmer overlays, and error recovery matching the Clubhouse gold standard.
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { MoreHorizontal, MapPin, Play, Copy, Share2, Flag, RotateCw } from 'lucide-react';
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
  /** Whether to mount the video player (Fix 2: mount gating) */
  shouldMountVideo?: boolean;
}

export const LongFormFeedCard = React.memo(function LongFormFeedCard({ 
  video, 
  onVideoTap, 
  onCreatorTap,
  className,
  index = 0,
  shouldMountVideo = true,
}: LongFormFeedCardProps) {
  const navigate = useNavigate();
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [shouldPlay, setShouldPlay] = useState(false);
  
  // Fix 4/6: Poster and video transition states
  const [posterLoaded, setPosterLoaded] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  
  // Video refs
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const isVideoReadyTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const isPriority = index < 6;

  // P0: TikTok-level 50% start / 10% stop hysteresis autoplay
  useEffect(() => {
    const element = videoContainerRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        const ratio = entries[0]?.intersectionRatio ?? 0;
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

  // Format timestamp
  const timeAgo = formatTimeAgo(video.createdAt, 'short');

  // Caption text
  const rawCaption = video.title || video.caption || video.content || '';
  const captionText = useMemo(() => removePlayedAtLine(rawCaption), [rawCaption]);
  const shouldTruncate = captionText.length > 150 && !isExpanded;
  const displayContent = shouldTruncate ? captionText.slice(0, 150) : captionText;

  // Dynamic aspect ratio calculation
  const aspectRatio = useMemo(() => {
    const width = video.mediaWidth || 16;
    const height = video.mediaHeight || 9;
    const rawRatio = width / height;
    return Math.max(0.8, Math.min(2.0, rawRatio));
  }, [video.mediaWidth, video.mediaHeight]);

  // Course location string
  const courseLocation = useMemo(() => {
    if (!video.golfCourse) return null;
    const parts = [
      video.golfCourse.region || video.golfCourse.sub_country, 
      video.golfCourse.country
    ].filter(Boolean);
    return parts.join(', ');
  }, [video.golfCourse]);

  // Extract stream UID
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

  // Reset states when video changes
  useEffect(() => {
    setIsVideoReady(false);
    setPosterLoaded(false);
    setHasError(false);
    return () => {
      if (isVideoReadyTimerRef.current) clearTimeout(isVideoReadyTimerRef.current);
    };
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

  // Fix 5: Play-gated transition with 100ms buffer
  const handlePlay = useCallback(() => {
    if (isVideoReadyTimerRef.current) clearTimeout(isVideoReadyTimerRef.current);
    isVideoReadyTimerRef.current = setTimeout(() => {
      setIsVideoReady(true);
    }, 100);
  }, []);

  // Fix 6: Error handler with retry
  const handleError = useCallback(() => {
    setHasError(true);
    setIsVideoReady(false);
  }, []);

  const handleRetry = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsVideoReady(false);
    setRetryKey(k => k + 1);
  }, []);

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

  // Whether the video layer is ready to show (play-gated)
  const videoIsReady = isVideoReady && shouldPlay && shouldMountVideo && !hasError;

  return (
    <>
      <div
        className={cn(
          "rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm",
          className
        )}
        data-video-card-id={video.id}
      >
        {/* Header */}
        <div 
          className="flex items-start gap-3 cursor-pointer" 
          style={{ padding: '10px 16px 6px 16px' }}
          onClick={onCreatorTap}
        >
          <div className="flex-shrink-0">
            <SquircleAvatar
              size={40}
              src={video.creatorAvatarUrl}
              alt={video.creatorName}
              fallback={video.creatorName?.charAt(0) || '?'}
              hideRing
            />
          </div>
          <div className="flex-1 min-w-0">
           <p className="font-semibold text-sm text-gray-900 leading-tight truncate">
              {video.creatorName}
            </p>
            <p className="text-xs text-gray-400 leading-tight truncate">
              <span>{timeAgo}</span>
            </p>
          </div>
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

        {/* Course Location Bar */}
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

        {/* Media Section - Dynamic aspect ratio */}
        <div 
          ref={videoContainerRef}
          className="relative w-full cursor-pointer bg-muted overflow-hidden will-change-transform"
          style={{ aspectRatio }}
          onClick={onVideoTap}
        >
          {/* Fix 4: Shimmer overlay (base layer) */}
          <div className="absolute inset-0 bg-gray-100 overflow-hidden">
            <div className="h-full w-full -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-gray-200/60 to-transparent motion-reduce:animate-none" />
          </div>

          {/* Poster image with fade-in (Fix 4/6) */}
          {posterUrl && (
            <img
              src={posterUrl}
              alt=""
              className={cn(
                "absolute inset-0 h-full w-full object-cover z-[1] transition-opacity duration-200 ease-out",
                posterLoaded ? "opacity-100" : "opacity-0",
                // Fix 5: Poster fades out ONLY when video is playing
                videoIsReady && "!opacity-0 duration-150"
              )}
              loading={isPriority ? "eager" : "lazy"}
              fetchPriority={isPriority ? "high" : "auto"}
              decoding="async"
              onLoad={() => setPosterLoaded(true)}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}

          {/* Video player - Fix 1: MediaRuntime, Fix 2: mount gating, Fix 7: no loop */}
          {hlsUrl && shouldMountVideo && !hasError && (
            <div 
              className={cn(
                "absolute inset-0 z-[2] transition-opacity duration-150 ease-out",
                videoIsReady ? "opacity-100" : "opacity-0"
              )}
            >
              <UnifiedVideoPlayer
                key={retryKey}
                src={hlsUrl}
                posterUrl={posterUrl}
                autoplay={shouldPlay}
                muted
                preload="auto"
                objectFit="cover"
                mediaId={streamId}
                surface="videos"
                managedByMediaRuntime={true}
                className="absolute inset-0 w-full h-full object-cover"
                onPlay={handlePlay}
                onError={handleError}
              />
            </div>
          )}
              
          {/* Fix 6: Error state overlay */}
          {hasError && (
            <div className="absolute inset-0 z-[3] bg-black/40 flex flex-col items-center justify-center gap-2">
              <button
                onClick={handleRetry}
                className="w-12 h-12 rounded-full bg-white/80 flex items-center justify-center active:scale-[0.95] transition-transform"
                aria-label="Retry playback"
              >
                <RotateCw className="w-5 h-5 text-gray-800" />
              </button>
              <span className="text-white/70 text-xs">Tap to retry</span>
            </div>
          )}

          {/* Play button overlay - shown when video is ready but paused */}
          {!hasError && posterLoaded && !shouldPlay && (
            <div className="absolute inset-0 z-[3] flex items-center justify-center">
              <div className="w-16 h-16 rounded-full backdrop-blur-md bg-black/35 border border-white/10 flex items-center justify-center">
                <Play className="h-8 w-8 text-white ml-1" fill="white" />
              </div>
            </div>
          )}
          
          {/* Review Indicators */}
          {isReview && (
            <>
              <div className="absolute top-3 left-3 z-10 pointer-events-none">
                <div className="px-2 py-1 bg-black/60 backdrop-blur-sm rounded-full text-white text-[10px] font-bold uppercase tracking-wider">
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
          {video.duration && (
            <div className="absolute bottom-3 right-3 z-[4] px-2 py-0.5 backdrop-blur-sm bg-black/60 rounded-md text-white text-xs font-medium tabular-nums">
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
  return (
    prevProps.video.id === nextProps.video.id &&
    prevProps.video.mediaUrl === nextProps.video.mediaUrl &&
    prevProps.onVideoTap === nextProps.onVideoTap &&
    prevProps.index === nextProps.index &&
    prevProps.shouldMountVideo === nextProps.shouldMountVideo
  );
});

export default LongFormFeedCard;
