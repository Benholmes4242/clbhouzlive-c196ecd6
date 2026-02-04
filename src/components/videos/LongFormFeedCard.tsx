/**
 * LongFormFeedCard - Full-width feed card for long-form videos
 * 
 * UNIFIED WITH CLUBHOUSE: Uses the exact same video wiring pattern as
 * ClubhouseVerticalGrid for consistent autoplay behavior.
 * 
 * INSTANT VIDEO PATTERN:
 * - Uses managedByMediaRuntime={false}, externallyManaged={false}
 * - Uses autoplay based on visibility (IntersectionObserver)
 * - Uses preload="auto" for instant buffering
 * - Direct browser-led autoplay (no MediaRuntime manual control)
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { MoreHorizontal, MapPin, Play, Copy, Share2, Flag, Loader2 } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { PostActionBar } from '@/components/posts/PostActionBar';
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

  // Format timestamp
  const timeAgo = formatTimeAgo(video.createdAt, 'short');

  // Caption text (use title or caption or content)
  const captionText = video.title || video.caption || video.content || '';
  const shouldTruncate = captionText.length > 150 && !isExpanded;
  const displayContent = shouldTruncate ? captionText.slice(0, 150) : captionText;

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

  return (
    <>
      <div
        className={cn(
          "bg-white overflow-hidden border-x border-border/40",
          className
        )}
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        data-video-card-id={video.id}
      >
        {/* Header - 3 column layout: avatar / meta / actions */}
        <div 
          className="flex items-start gap-3 cursor-pointer" 
          style={{ padding: '12px 16px 8px 16px' }}
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

          {/* Middle: Meta */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-foreground text-sm leading-tight truncate">
              {video.creatorName}
            </p>
            <p className="text-xs text-muted-foreground leading-tight mt-0.5 truncate">
              <span>{(video.followerCount || 0).toLocaleString()} followers</span>
              <span className="mx-1">·</span>
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
        {video.golfCourseName && (
          <div 
            className="flex items-center gap-1.5 text-xs text-muted-foreground"
            style={{ padding: '0 16px 8px 16px' }}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Filmed at {video.golfCourseName}</span>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-border/30 mx-4" />

        {/* Media Section - TikTok-Level with GPU acceleration */}
        <div 
          ref={videoContainerRef}
          className="relative w-full aspect-video cursor-pointer bg-muted overflow-hidden will-change-transform"
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
          
          {/* Duration Badge */}
          {video.duration && (
            <div className="absolute bottom-3 right-3 px-2 py-0.5 backdrop-blur-md bg-black/35 border border-white/10 rounded text-white text-xs font-medium tabular-nums">
              {video.duration}
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
        aspectRatio={16 / 9}
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
    prevProps.video.followerCount === nextProps.video.followerCount &&
    prevProps.className === nextProps.className
  );
});

export default LongFormFeedCard;
