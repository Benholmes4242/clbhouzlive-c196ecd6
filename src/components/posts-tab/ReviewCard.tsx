import React, { useState } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { Star } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface ReviewCardProps {
  post: FeedPost;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ post }) => {
  const [expanded, setExpanded] = useState(false);
  const review = post.review;
  if (!review) return null;

  const thumbnailUrl = review.courseImageUrl || post.mediaItems[0]?.thumbnailUrl || post.mediaItems[0]?.imageUrl;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });
  const location = [review.courseRegion, review.courseCountry].filter(Boolean).join(', ');

  return (
    <div
      className="bg-card rounded-xl overflow-hidden shadow-sm border border-border/50 cursor-pointer"
      onClick={() => { /* TODO: wire to review detail */ }}
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
