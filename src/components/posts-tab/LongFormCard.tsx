import React, { useState } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { Play, Heart, MessageCircle, Share2 } from 'lucide-react';
import { useFullscreenFeed } from '@/components/fullscreen-feed/hooks/useFullscreenFeed';
import { formatDistanceToNow } from 'date-fns';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface LongFormCardProps {
  post: FeedPost;
  allPosts?: FeedPost[];
  postIndex?: number;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export const LongFormCard: React.FC<LongFormCardProps> = ({ post, allPosts, postIndex }) => {
  const [expanded, setExpanded] = useState(false);
  const firstMedia = post.mediaItems[0];
  const thumbnailUrl = firstMedia?.thumbnailUrl || firstMedia?.imageUrl;
  const duration = firstMedia?.duration;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  return (
    <div
      className="bg-card overflow-hidden border-b border-border/50 cursor-pointer"
      onClick={() => {
        if (allPosts && postIndex != null) {
          useFullscreenFeed.getState().open({
            posts: allPosts,
            startIndex: postIndex,
            sourceId: 'posts',
          });
        }
      }}
    >
      {/* Media area — 16:9 */}
      <div className="relative aspect-video bg-muted">
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {/* Play icon center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(0,0,0,0.45)',
            }}
          >
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        {/* Duration badge */}
        {duration != null && duration > 0 && (
          <div
            className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
            style={{
              background: 'rgba(0,0,0,0.35)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {formatDuration(duration)}
          </div>
        )}
      </div>

      {/* Caption */}
      {post.caption && (
        <div className="px-3 pt-2">
          <p className={`text-sm font-semibold text-foreground ${expanded ? '' : 'line-clamp-2'}`}>
            {post.caption}
          </p>
          {!expanded && post.caption.length > 100 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(true); }}
              className="text-xs font-semibold text-muted-foreground mt-0.5"
            >
              See more
            </button>
          )}
          {expanded && post.caption.length > 100 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
              className="text-sm font-semibold text-muted-foreground mt-0.5"
            >
              less
            </button>
          )}
        </div>
      )}

      {/* Creator row */}
      <div className="flex items-center gap-2 px-3 py-1">
        {post.avatarUrl && (
          <SquircleAvatar
            src={post.avatarUrl}
            alt=""
            size={20}
            hideRing
          />
        )}
        <span className="text-xs text-muted-foreground truncate">
          {post.displayName}
        </span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
      </div>

      {/* Engagement */}
      <div className="flex items-center gap-4 px-3 pb-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" />
          {formatCompact(post.likeCount)}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" />
          {formatCompact(post.commentCount)}
        </span>
        {post.shareCount > 0 && (
          <span className="flex items-center gap-1">
            <Share2 className="h-3.5 w-3.5" />
            {formatCompact(post.shareCount)}
          </span>
        )}
      </div>
    </div>
  );
};
