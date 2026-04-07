import React, { useState, useEffect, useRef } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';
import { Play, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';
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
  const isVideo = firstMedia?.type === 'video';
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
          useFullscreenFeedStore.getState().open(allPosts, postIndex);
        }
      }}
    >
      {/* Media area — 16:9 */}
      <div
        className="relative aspect-video bg-muted"
        data-posts-tile-index={postIndex ?? -1}
        data-hls-url={hlsUrl || ''}
      >
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        )}

        {/* Play icon — only for videos */}
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.45)' }}
            >
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        )}

        {/* Carousel indicator — for multi-media posts */}
        {!isVideo && post.mediaItems.length > 1 && (
          <div
            className="absolute top-2 right-2 px-2 py-1 rounded-full text-[11px] font-semibold text-white"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          >
            1/{post.mediaItems.length}
          </div>
        )}

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

      {/* Caption — headline first, bold */}
      {post.caption && (
        <div style={{ padding: '11px 14px 0' }}>
          <p
            className={expanded ? '' : 'line-clamp-2'}
            style={{ fontSize: 15, fontWeight: 700, color: 'hsl(var(--foreground))', lineHeight: 1.35, margin: 0, letterSpacing: '-0.01em' }}
          >
            {post.caption}
          </p>
          {!expanded && post.caption.length > 100 && (
            <button onClick={(e) => { e.stopPropagation(); setExpanded(true); }} className="text-xs font-semibold text-[#d97706] mt-0.5">
              See more
            </button>
          )}
          {expanded && post.caption.length > 100 && (
            <button onClick={(e) => { e.stopPropagation(); setExpanded(false); }} className="text-xs font-semibold text-[#d97706] mt-0.5">
              less
            </button>
          )}
        </div>
      )}

      {/* Creator + time row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px 10px', flexWrap: 'wrap' }}>
        {post.avatarUrl && (
          <SquircleAvatar src={post.avatarUrl} alt="" size={26} hideRing />
        )}
        <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
          {post.displayName}
        </span>
        <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>·</span>
        <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>{timeAgo}</span>
        <div style={{ flex: 1 }} />
        {isOwnPost && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this post?')) onDelete(); }}
            className="p-1.5 -mr-1 text-muted-foreground"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'hsl(var(--border) / 0.5)', margin: '0 14px' }} />

      {/* Engagement row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '9px 14px 11px', gap: 4 }}>
        <button
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
        >
          <Heart className="w-4 h-4 text-muted-foreground" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>
            {formatCompact(post.likeCount)}
          </span>
        </button>
        <div style={{ width: 1, height: 18, background: 'hsl(var(--border))', margin: '0 10px' }} />
        <button
          onClick={(e) => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <MessageCircle className="h-[19px] w-[19px]" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>
            {formatCompact(post.commentCount)}
          </span>
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={(e) => e.stopPropagation()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            minHeight: 34, padding: '0 14px', borderRadius: 20,
            fontSize: 13, fontWeight: 600,
            background: 'transparent',
            border: '1.5px solid hsl(var(--border))',
            color: 'hsl(var(--muted-foreground))',
            cursor: 'pointer',
          }}
        >
          <Share2 className="h-[14px] w-[14px]" />
          Share
        </button>
      </div>
    </div>
  );
};