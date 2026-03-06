import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Heart, MessageCircle, Share2, MapPin } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';

import { VideoCardAutoplay } from './VideoCardAutoplay';

interface VideoCardProps {
  post: FeedPost;
  isAutoplayEligible?: boolean;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function formatVideoDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (v: number) => String(v).padStart(2, '0');
  if (h > 0) return `${h}:${pad(m)}:${pad(sec)}`;
  return `${m}:${pad(sec)}`;
}

export const VideoCard = React.memo(function VideoCard({ post, isAutoplayEligible = false }: VideoCardProps) {
  const firstVideo = post.mediaItems.find(m => m.type === 'video');
  const thumbnailUrl = firstVideo?.thumbnailUrl || '';
  const hlsUrl = firstVideo?.hlsUrl || '';
  const duration = firstVideo?.duration || 0;
  const timeAgo = formatDistanceToNow(new Date(post.createdAt), { addSuffix: true });

  const handleTap = () => {
    // Fullscreen player wired in Phase 5
    // Fullscreen player wired later
  };

  return (
    <article className="bg-card rounded-2xl overflow-hidden shadow-sm">
      {/* Creator header */}
      <div className="flex items-center gap-3 p-3">
        <img
          src={post.avatarUrl || '/placeholder.svg'}
          alt={post.displayName}
          className="h-9 w-9 rounded-full object-cover shrink-0 bg-muted"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-foreground truncate">
              {post.displayName}
            </span>
            {post.isVerified && (
              <svg className="h-3.5 w-3.5 text-primary shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <button className="p-1 text-muted-foreground" aria-label="More options">
          <MoreHorizontal className="h-5 w-5" />
        </button>
      </div>

      {/* Caption */}
      {post.caption && (
        <p className="text-sm text-foreground px-3 pb-2 line-clamp-2">{post.caption}</p>
      )}

      {/* Course tag */}
      {post.review?.courseName && (
        <div className="flex items-center gap-1 px-3 pb-2">
          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground truncate">{post.review.courseName}</span>
        </div>
      )}

      {/* Video area */}
      <button
        className="relative w-full aspect-video bg-muted cursor-pointer"
        onClick={handleTap}
        aria-label={`Play video by ${post.displayName}`}
      >
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        )}
        {/* Autoplay layer */}
        {hlsUrl && isAutoplayEligible && (
          <VideoCardAutoplay
            hlsUrl={hlsUrl}
            posterUrl={thumbnailUrl}
            isEligible={isAutoplayEligible}
          />
        )}
        {/* Duration badge */}
        {duration > 0 && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-xs font-medium rounded bg-black/60 text-white backdrop-blur-sm z-10">
            {formatVideoDuration(duration)}
          </span>
        )}
      </button>

      {/* Engagement row */}
      <div className="flex items-center gap-5 px-3 py-2.5">
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Heart className="h-4 w-4" />
          {formatCompact(post.likeCount)}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <MessageCircle className="h-4 w-4" />
          {formatCompact(post.commentCount)}
        </span>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Share2 className="h-4 w-4" />
          {formatCompact(post.shareCount)}
        </span>
      </div>
    </article>
  );
});
