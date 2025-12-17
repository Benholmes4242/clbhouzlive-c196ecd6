/**
 * BusinessPostCard - Premium post tile with action bar
 * Full-width tile with subtle elevation on gradient background
 * Action bar: Like / Comment / Reshare / Send (via global PostActionBar)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BusinessPost } from '@/hooks/useBusinessPosts';
import {
  MoreHorizontal,
  Play,
  Copy,
  Share2,
  Pencil,
  Eye,
  Pin,
  BarChart2,
  Trash2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { getStreamPoster, getStreamIdFromUrl } from '@/utils/stream';
import GridAutoplayVideo from '@/components/profile/activity/GridAutoplayVideo';
import CommentsPage from '@/components/clubhouse/cinematic/CommentsPage';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { usePostEngagement } from '@/hooks/usePostEngagement';
import { PostActionBar } from '@/components/posts/PostActionBar';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RegisterVideoFn } from '@/hooks/useGridAutoplay';

interface BusinessPostCardProps {
  post: BusinessPost;
  businessName?: string;
  businessLogo?: string | null;
  followerCount?: number;
  canManage?: boolean;
  registerVideo?: RegisterVideoFn;
  isPlaying?: boolean;
  videoIndex?: number;
}

export default function BusinessPostCard({
  post,
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
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const primaryMedia = post.post_media?.[0];
  const isVideo = primaryMedia?.media_type === 'video';
  const hasMultipleMedia = (post.post_media?.length || 0) > 1;

  // Engagement data for social proof line (like/comment actions handled by PostActionBar)
  const { likesCount, commentsCount } = usePostEngagement(post.id);

  // Format timestamp like LinkedIn
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

  // Truncate content if longer than 150 chars
  const content = post.content || '';
  const shouldTruncate = content.length > 150 && !isExpanded;
  const displayContent = shouldTruncate ? content.slice(0, 150) : content;

  // Get video HLS URL and poster
  const streamId = isVideo ? getStreamIdFromUrl(primaryMedia?.media_url || '') : null;
  const hlsUrl = streamId ? `https://videodelivery.net/${streamId}/manifest/video.m3u8` : null;
  const thumbnailUrl = isVideo
    ? primaryMedia?.poster_url || getStreamPoster(primaryMedia?.media_url || '', '1s', 600)
    : primaryMedia?.media_url;

  // Register video for autoplay (ALL videos for business, not every 3rd)
  useEffect(() => {
    if (!isVideo || !videoRef.current || !registerVideo) return;
    
    registerVideo({
      id: post.id,
      element: videoRef.current,
      isCandidate: true, // ALL videos are candidates for business feed
      sortIndex: videoIndex,
    });

    return () => {
      registerVideo({
        id: post.id,
        element: null,
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
    toast.info('Pin to top coming soon');
  }, []);

  const handleViewInsights = useCallback(() => {
    toast.info('Insights coming soon');
  }, []);

  const handleDeletePost = useCallback(() => {
    toast.info('Delete post coming soon');
  }, []);

  return (
    <>
      {/* Post tile - full width with border gutter */}
      <div
        className="bg-white overflow-hidden border-x border-border/40"
        style={{
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
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
                  <DropdownMenuItem onClick={handlePinToTop}>
                    <Pin className="h-4 w-4 mr-2" />
                    Pin to top
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
        {content && (
          <div style={{ padding: '0 16px 10px 16px' }}>
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
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
            </p>
          </div>
        )}

        {/* Subtle divider under header/caption before media */}
        <div className="h-px bg-border/30 mx-4" />

        {/* Media - centered with safety net */}
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
              <GridAutoplayVideo
                ref={videoRef}
                src={hlsUrl}
                poster={thumbnailUrl || undefined}
                className="w-full h-full object-cover max-w-full"
              />
            ) : isVideo ? (
              <div className="relative w-full h-full bg-muted">
                <img src={thumbnailUrl || ''} alt="" className="w-full h-full object-cover" />
                {/* Play button overlay */}
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

      {/* Comments - use Clubhouse slide-in panel with light theme */}
      <CommentsPage
        isOpen={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        postId={post.id}
        videoThumbnail={thumbnailUrl || undefined}
        creatorName={businessName}
        creatorAvatar={businessLogo || undefined}
        theme="light"
      />
    </>
  );
}

