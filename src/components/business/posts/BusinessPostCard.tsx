/**
 * BusinessPostCard - Premium post tile with action bar
 * Full-width tile with subtle elevation on gradient background
 * Action bar: Appreciate / Comment / Reshare / Send
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { BusinessPost } from '@/hooks/useBusinessPosts';
import {
  Heart,
  MessageSquare,
  Repeat2,
  Send,
  MoreHorizontal,
  Globe,
  Play,
  Copy,
  Share2,
  Flag,
  Pencil,
  Eye,
  Pin,
  BarChart2,
  Trash2,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { getStreamPoster, getStreamIdFromUrl } from '@/utils/stream';
import GridAutoplayVideo from '@/components/profile/activity/GridAutoplayVideo';
import CommentsModal from '@/components/posts/CommentsModal';
import { usePostEngagement } from '@/hooks/usePostEngagement';
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
  isOwner?: boolean;
  registerVideo?: RegisterVideoFn;
  isPlaying?: boolean;
  videoIndex?: number;
}

export default function BusinessPostCard({
  post,
  businessName,
  businessLogo,
  followerCount = 0,
  isOwner = false,
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

  // Engagement hook for like/comment functionality
  const { hasLiked, likesCount, toggleLike, isTogglingLike, commentsCount } = usePostEngagement(post.id);

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

  const handleAppreciate = useCallback(() => {
    toggleLike();
  }, [toggleLike]);

  const handleComment = useCallback(() => {
    setCommentsOpen(true);
  }, []);

  const handleReshare = useCallback(() => {
    toast.info('Reshare coming soon');
  }, []);

  const handleSend = useCallback(async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: businessName, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    }
  }, [post.id, businessName]);

  const handleCopyLink = useCallback(async () => {
    await navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    toast.success('Link copied');
  }, [post.id]);

  const handleReport = useCallback(() => {
    toast.info('Report submitted');
  }, []);

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
      {/* Post tile - flat on page background */}
      <div className="bg-white overflow-hidden border-y border-border/30">
        {/* Post header */}
        <div className="px-4 py-3">
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              {/* Business avatar */}
              <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                {businessLogo ? (
                  <img src={businessLogo} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground text-lg font-semibold">
                    {businessName?.charAt(0) || 'B'}
                  </div>
                )}
              </div>

              {/* Business info */}
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-sm leading-tight">{businessName || 'Business'}</p>
                <p className="text-xs text-muted-foreground leading-tight">{followerCount.toLocaleString()} followers</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <span>{timeAgo}</span>
                  <span>•</span>
                  <Globe className="h-3 w-3" />
                </div>
              </div>
            </div>

            {/* Three-dots menu */}
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
                {/* Everyone */}
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSend}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Send
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleReport}>
                  <Flag className="h-4 w-4 mr-2" />
                  Report
                </DropdownMenuItem>

                {/* Owner/admin only */}
                {isOwner && (
                  <>
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
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Post content */}
        {content && (
          <div className="px-4 pb-3">
            <p className="text-sm text-foreground whitespace-pre-wrap">
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

        {/* Media - Phase 2: strict wrapper to prevent overflow */}
        {primaryMedia && (
          <div
            className="relative w-full overflow-hidden"
            style={{
              aspectRatio: isVideo ? '16 / 9' : undefined,
              maxHeight: isVideo ? undefined : '500px',
              minWidth: 0, // Flex layout gotcha fix
            }}
          >
            {isVideo && hlsUrl ? (
              <GridAutoplayVideo
                ref={videoRef}
                src={hlsUrl}
                poster={thumbnailUrl || undefined}
                className="w-full h-full object-cover"
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
            {likesCount > 0 && <span>{likesCount} golfer{likesCount !== 1 ? 's' : ''} appreciated</span>}
            {likesCount > 0 && commentsCount > 0 && <span> · </span>}
            {commentsCount > 0 && (
              <button onClick={handleComment} className="hover:underline">
                {commentsCount} comment{commentsCount !== 1 ? 's' : ''}
              </button>
            )}
          </div>
        )}

        {/* Action bar - Phase 3: Appreciate/Comment/Reshare/Send */}
        <div className="py-1 flex items-center justify-around border-t border-border/30">
          <ActionButton
            icon={Heart}
            label="Appreciate"
            isActive={hasLiked}
            isLoading={isTogglingLike}
            onClick={handleAppreciate}
          />
          <ActionButton icon={MessageSquare} label="Comment" onClick={handleComment} />
          <ActionButton icon={Repeat2} label="Reshare" onClick={handleReshare} />
          <ActionButton icon={Send} label="Send" onClick={handleSend} />
        </div>
      </div>

      {/* Comments Modal - Phase 4: reuse existing with grey variant */}
      <CommentsModal isOpen={commentsOpen} onClose={() => setCommentsOpen(false)} postId={post.id} theme="grey" />
    </>
  );
}

interface ActionButtonProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
}

function ActionButton({ icon: Icon, label, isActive, isLoading, onClick }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      aria-label={label}
      className={cn(
        'flex flex-col items-center gap-0.5 py-2 px-3 rounded-md transition-colors hover:bg-muted/50 disabled:opacity-50',
        isActive ? 'text-[#F7931E]' : 'text-muted-foreground'
      )}
    >
      {isLoading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <Icon className="h-5 w-5" fill={isActive ? 'currentColor' : 'none'} />
      )}
      <span className="text-xs font-medium">{label}</span>
    </button>
  );
}
