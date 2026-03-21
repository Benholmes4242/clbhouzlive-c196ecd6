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
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ post, allPosts, postIndex, isOwnPost, onDelete }) => {
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
          // TODO Brief 3: fullscreen feed open
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
        <div className="relative aspect-[4/3] bg-muted mt-1 overflow-hidden">
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

      {/* Engagement */}
      <div className="flex items-center gap-4 px-3 pb-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" />
          {formatCompact(post.likeCount)}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" />
          {formatCompact(post.commentCount)}
        </span>
      </div>

      {/* Creator + time */}
      <div className="flex items-center gap-2 px-3 pb-3">
        {post.avatarUrl && (
          <SquircleAvatar
            src={post.avatarUrl}
            alt=""
            size={16}
            hideRing
          />
        )}
        <span className="text-xs text-muted-foreground truncate">
          {post.displayName}
        </span>
        <span className="text-xs text-muted-foreground">·</span>
        <span className="text-xs text-muted-foreground">{timeAgo}</span>
      </div>
    </div>
  );
};