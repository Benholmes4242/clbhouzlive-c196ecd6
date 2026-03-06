import React from 'react';
import { Heart, MessageCircle, Share2, MapPin, MoreHorizontal, BadgeCheck } from 'lucide-react';
import { formatDuration } from '@/utils/formatDuration';
import type { FeedPost } from '@/components/media-system/types/media';

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface VideoCardProps {
  post: FeedPost;
}

const VideoCard: React.FC<VideoCardProps> = ({ post }) => {
  const media = post.mediaItems[0];
  const posterUrl = media?.thumbnailUrl || media?.imageUrl || '';
  const duration = media?.duration ?? 0;

  return (
    <div className="bg-card rounded-2xl overflow-hidden shadow-sm">
      {/* Creator header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <img
          src={post.avatarUrl || '/placeholder.svg'}
          alt={post.displayName}
          className="w-9 h-9 rounded-full object-cover shrink-0 bg-muted"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-foreground truncate">
              {post.displayName || post.username}
            </span>
            {post.isVerified && (
              <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
            )}
            <span className="text-xs text-muted-foreground shrink-0">
              · {timeAgo(post.createdAt)}
            </span>
          </div>
        </div>
        <button className="p-1 shrink-0" aria-label="More options">
          <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Caption */}
      {post.caption && (
        <p className="text-sm text-foreground px-4 pb-2 line-clamp-2">
          {post.caption}
        </p>
      )}

      {/* Course tag */}
      {post.review?.courseName && (
        <div className="flex items-center gap-1 px-4 pb-2">
          <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground truncate">
            {post.review.courseName}
          </span>
        </div>
      )}

      {/* Video area — 16:9 */}
      <div className="relative aspect-video bg-muted" data-video-card>
        {posterUrl && (
          <img
            src={posterUrl}
            alt=""
            loading="lazy"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {/* Duration badge */}
        {duration > 0 && (
          <span
            className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded-md text-xs font-medium text-white"
            style={{ background: 'rgba(0,0,0,0.6)' }}
          >
            {formatDuration(duration)}
          </span>
        )}
      </div>

      {/* Engagement row */}
      <div className="flex items-center gap-5 px-4 py-3">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Heart className="w-4 h-4" />
          {post.likeCount > 0 && formatCount(post.likeCount)}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MessageCircle className="w-4 h-4" />
          {post.commentCount > 0 && formatCount(post.commentCount)}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Share2 className="w-4 h-4" />
          {post.shareCount > 0 && formatCount(post.shareCount)}
        </span>
      </div>
    </div>
  );
};

export default React.memo(VideoCard);
