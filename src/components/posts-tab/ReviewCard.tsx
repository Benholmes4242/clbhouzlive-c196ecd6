import React, { useState } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { Star, Play, Heart, MessageCircle } from 'lucide-react';
import { useFullscreenFeed } from '@/components/fullscreen-feed/hooks/useFullscreenFeed';
import { formatDistanceToNow } from 'date-fns';

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface ReviewCardProps {
  post: FeedPost;
  allPosts?: FeedPost[];
  postIndex?: number;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ post, allPosts, postIndex }) => {
  const [expanded, setExpanded] = useState(false);
  const review = post.review;
  if (!review) return null;

  const userMedia = post.mediaItems[0];
  const thumbnailUrl = userMedia?.thumbnailUrl || userMedia?.imageUrl || review.courseImageUrl;
  const isVideo = userMedia?.type === 'video';
  const duration = userMedia?.duration;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  const location = [review.courseRegion, review.courseCountry].filter(Boolean).join(', ');

  return (
    <div
      className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 cursor-pointer"
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
      {/* Amber accent stripe */}
      <div className="h-[3px] bg-amber-500" />

      {/* Course info header */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{review.courseName}</p>
          {location && (
            <p className="text-xs text-muted-foreground truncate">{location}</p>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2 shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5">
          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            {review.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Media thumbnail — 4:3 landscape */}
      {thumbnailUrl && (
        <div className="relative aspect-[4/3] bg-muted mx-3 mt-1 rounded-lg overflow-hidden">
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
              className="text-sm font-semibold text-muted-foreground mt-0.5"
            >
              more
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
          <img
            src={post.avatarUrl}
            alt=""
            className="w-4 h-4 rounded-full object-cover"
            loading="lazy"
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
