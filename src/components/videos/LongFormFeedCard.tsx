/**
 * LongFormFeedCard - Full-width feed card for long-form videos
 * Matches BusinessPostCard layout exactly:
 * - Header: Avatar + Name + Followers + Time + Menu
 * - Caption: Text content
 * - Divider
 * - Media: Full-width 16:9 video with duration badge
 * - Social proof: Likes / Comments
 * - Action bar: Like / Comment / Reshare / Send
 */

import React, { useState, useCallback, useMemo } from 'react';
import { MoreHorizontal, MapPin, Play, Copy, Share2, Flag } from 'lucide-react';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { PostActionBar } from '@/components/posts/PostActionBar';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { formatTimeAgo } from '@/utils/formatTime';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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
}

export function LongFormFeedCard({ 
  video, 
  onVideoTap, 
  onCreatorTap,
  className 
}: LongFormFeedCardProps) {
  const [imageError, setImageError] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Engagement data
  const { likesCount, commentsCount } = usePostEngagement(video.id);

  // Format timestamp
  const timeAgo = formatTimeAgo(video.createdAt, 'short');

  // Caption text (use title or caption or content)
  const captionText = video.title || video.caption || video.content || '';
  const shouldTruncate = captionText.length > 150 && !isExpanded;
  const displayContent = shouldTruncate ? captionText.slice(0, 150) : captionText;

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

        {/* Media - Full Width 16:9 */}
        <div 
          className="relative w-full aspect-video cursor-pointer bg-muted overflow-hidden"
          onClick={onVideoTap}
        >
          {!imageError && video.thumbnailUrl ? (
            <img
              src={video.thumbnailUrl}
              alt={video.title || 'Video'}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-100">
              <Play className="h-12 w-12 text-muted-foreground/40" />
            </div>
          )}

          {/* Duration Badge */}
          {video.duration && (
            <div className="absolute bottom-3 right-3 px-2 py-0.5 bg-black/70 rounded text-white text-xs font-medium tabular-nums">
              {video.duration}
            </div>
          )}

          {/* Play Overlay on Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <div className="w-16 h-16 rounded-full bg-black/60 flex items-center justify-center">
              <Play className="h-8 w-8 text-white ml-1" fill="white" />
            </div>
          </div>
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
}

export default LongFormFeedCard;
