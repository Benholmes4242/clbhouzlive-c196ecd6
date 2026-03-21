import React, { useState, useEffect, useRef } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { Play, Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { formatCompact, formatDuration } from './utils';

interface LongFormCardProps {
  post: FeedPost;
  allPosts?: FeedPost[];
  postIndex?: number;
  isOwnPost?: boolean;
  onDelete?: () => void;
}

export const LongFormCard: React.FC<LongFormCardProps> = ({ post, allPosts, postIndex, isOwnPost, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const firstMedia = post.mediaItems[0];
  const thumbnailUrl = firstMedia?.thumbnailUrl || firstMedia?.imageUrl;
  const duration = firstMedia?.duration;
  const hlsUrl = firstMedia?.hlsUrl;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  const tileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = tileRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // TODO Brief 3: onViewPreload
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hlsUrl]);

  return (
    <div
      ref={tileRef}
      className="bg-card overflow-hidden border-b border-border/50 cursor-pointer active:scale-[0.99] transition-transform"
      
      onClick={() => {
        if (allPosts && postIndex != null) {
          // TODO Brief 3: fullscreen feed open
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
              className="text-xs font-semibold text-[#d97706] mt-0.5"
            >
              See more
            </button>
          )}
          {expanded && post.caption.length > 100 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(false); }}
              className="text-xs font-semibold text-[#d97706] mt-0.5"
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

        {/* Three dots — own post delete */}
        {isOwnPost && onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm('Delete this post?')) onDelete();
            }}
            className="ml-auto p-2 -mr-1 text-muted-foreground hover:text-foreground"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
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