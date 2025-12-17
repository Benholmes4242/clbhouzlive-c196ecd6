/**
 * TaggedPostCard - Card for posts by others that tag this business
 * Similar to BusinessPostCard but shows author info instead of business
 */
import React, { useState, useCallback } from 'react';
import { TaggedPost } from '@/hooks/useBusinessTaggedPosts';
import { MoreHorizontal, Play, EyeOff, Flag, Copy, Share2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { getStreamPoster, getStreamIdFromUrl } from '@/utils/stream';
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

interface TaggedPostCardProps {
  post: TaggedPost;
  canManage?: boolean;
  onHide?: (postId: string) => void;
}

export default function TaggedPostCard({
  post,
  canManage = false,
  onHide,
}: TaggedPostCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);

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

  const content = post.content || '';
  const shouldTruncate = content.length > 150 && !isExpanded;
  const displayContent = shouldTruncate ? content.slice(0, 150) : content;

  const streamId = isVideo ? getStreamIdFromUrl(primaryMedia?.media_url || '') : null;
  const thumbnailUrl = isVideo
    ? primaryMedia?.poster_url || getStreamPoster(primaryMedia?.media_url || '', '1s', 600)
    : primaryMedia?.media_url;

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
              {author?.username ? `@${author.username}` : ''} · {timeAgo}
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

        {/* Divider */}
        <div className="h-px bg-border/30 mx-4" />

        {/* Media */}
        {primaryMedia && (
          <div
            className="relative w-full overflow-hidden flex justify-center items-center"
            style={{
              aspectRatio: isVideo ? '16 / 9' : undefined,
              maxHeight: isVideo ? undefined : '500px',
              minWidth: 0,
            }}
          >
            {isVideo ? (
              <div className="relative w-full h-full bg-muted">
                <img src={thumbnailUrl || ''} alt="" className="w-full h-full object-cover" />
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
        creatorName={authorName}
        creatorAvatar={authorAvatar || undefined}
        theme="grey"
      />
    </>
  );
}
