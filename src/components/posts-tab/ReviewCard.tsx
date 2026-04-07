import React, { useState, useEffect, useRef } from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import type { FeedPost } from '@/components/media-system/types/media';
import { Star, Play, Heart, MessageCircle, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { formatCompact } from './utils';

interface ReviewCardProps {
  post: FeedPost;
  allPosts?: FeedPost[];
  postIndex?: number;
  isOwnPost?: boolean;
  onDelete?: () => void;
  likeState?: { isLiked: boolean; count: number };
  onLike?: () => void;
  onComment?: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ post, allPosts, postIndex, isOwnPost, onDelete, likeState, onLike, onComment }) => {
  const [expanded, setExpanded] = useState(false);
  const review = post.review;
  const tileRef = useRef<HTMLDivElement>(null);
  const hlsUrl = post.mediaItems[0]?.hlsUrl;

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

  if (!review) return null;

  const userMedia = post.mediaItems[0];
  const thumbnailUrl = userMedia?.thumbnailUrl || userMedia?.imageUrl || review.courseImageUrl;
  const isVideo = userMedia?.type === 'video';
  const duration = userMedia?.duration;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  const location = [review.courseRegion, review.courseCountry].filter(Boolean).join(', ');

  // Unified amber accent for all rating tiers
  const accentColor = '#f59e0b';

  return (
    <div
      ref={tileRef}
      className="bg-card overflow-hidden cursor-pointer active:scale-[0.99] transition-transform"
      
      onClick={() => {
        if (allPosts && postIndex != null) {
          useFullscreenFeedStore.getState().open(allPosts, postIndex);
        }
      }}
    >
      {/* Accent stripe — unified amber */}
      <div className="h-px" style={{ backgroundColor: accentColor }} />

      {/* Course info header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{review.courseName}</p>
          {location && (
            <p className="text-xs text-muted-foreground truncate">{location}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 ml-2 shrink-0">
          <div
            className="flex items-center gap-1 rounded-full px-2 py-0.5"
            style={{
              backgroundColor: `${accentColor}1A`,
            }}
          >
            <Star className="w-3 h-3" style={{ color: accentColor, fill: accentColor }} />
            <span className="text-xs font-semibold" style={{ color: accentColor }}>
              {review.rating.toFixed(1)}
            </span>
          </div>
          {/* Three dots — own post delete */}
          {isOwnPost && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm('Delete this post?')) onDelete();
              }}
              className="p-1.5 -mr-1 text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Media thumbnail — full bleed 4:3 landscape */}
      {thumbnailUrl && (
        <div
          className="relative aspect-[4/3] bg-muted mt-1 overflow-hidden"
          data-posts-tile-index={postIndex ?? -1}
          data-hls-url={userMedia?.hlsUrl || ''}
        >
          <img
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }}>
                <Play className="w-4 h-4 text-white fill-white ml-0.5" />
              </div>
            </div>
          )}
          {isVideo && duration != null && duration > 0 && (
            <div
              className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
              style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}
            </div>
          )}
          {post.mediaItems.length > 1 && (
            <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-md">
              1/{post.mediaItems.length}
            </div>
          )}
        </div>
      )}

      {/* Review text */}
      {post.caption && (
        <div className="px-3 py-2">
          <p className={`text-sm text-foreground ${expanded ? '' : 'line-clamp-3'}`}>
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

      {/* Divider */}
      <div style={{ height: 1, background: 'hsl(var(--border) / 0.5)', margin: '0 14px' }} />

      {/* Engagement + creator combined row */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '9px 14px 11px', gap: 4 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onLike?.(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
        >
          {likeState?.isLiked ? (
            <span style={{ fontSize: 16, lineHeight: 1 }}>🧡</span>
          ) : (
            <Heart className="w-4 h-4" style={{ color: 'hsl(var(--muted-foreground))' }} />
          )}
          <span style={{ fontSize: 13, fontWeight: 700, color: likeState?.isLiked ? '#F7931E' : 'hsl(var(--muted-foreground))' }}>
            {formatCompact(likeState?.count ?? post.likeCount)}
          </span>
        </button>
        <div style={{ width: 1, height: 18, background: 'hsl(var(--border))', margin: '0 10px' }} />
        <button
          onClick={(e) => { e.stopPropagation(); onComment?.(); }}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <MessageCircle className="h-[19px] w-[19px]" style={{ color: 'hsl(var(--muted-foreground))' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'hsl(var(--muted-foreground))' }}>
            {formatCompact(post.commentCount)}
          </span>
        </button>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {post.avatarUrl && (
            <SquircleAvatar src={post.avatarUrl} alt="" size={22} hideRing />
          )}
          <span style={{ fontSize: 12, fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            {post.displayName}
          </span>
          <span style={{ fontSize: 11, color: 'hsl(var(--muted-foreground))' }}>· {timeAgo}</span>
        </div>
        {isOwnPost && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this post?')) onDelete(); }}
            className="p-1.5 -mr-1 text-muted-foreground ml-1"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};