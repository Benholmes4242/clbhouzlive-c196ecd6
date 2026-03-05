import React, { useCallback } from 'react';
import { Eye } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';

interface WatchTileProps {
  post: FeedPost;
  index: number;
  onTap: (post: FeedPost, index: number) => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export const WatchTile = React.memo(function WatchTile({ post, index, onTap }: WatchTileProps) {
  const media = post.mediaItems[0];
  const thumbnailUrl = media?.thumbnailUrl;
  const duration = media?.duration;
  const engagementCount = post.likeCount + post.commentCount + post.shareCount;

  const handleTap = useCallback(() => {
    onTap(post, index);
  }, [post, index, onTap]);

  return (
    <button
      onClick={handleTap}
      className="relative aspect-square overflow-hidden rounded-[4px] bg-white/[0.04] active:scale-[0.97] focus:outline-none"
      style={{ transition: 'transform 120ms ease-out' }}
      aria-label={`Video by ${post.displayName}`}
    >
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="absolute inset-0 bg-white/[0.06]" />
      )}

      {/* Duration badge - bottom right */}
      {duration != null && duration > 0 && (
        <span className="absolute bottom-1.5 right-1.5 px-[5px] py-[2px] rounded-[4px] bg-black/75 text-white text-[11px] font-semibold leading-tight">
          {formatDuration(duration)}
        </span>
      )}

      {/* Engagement badge - bottom left */}
      {engagementCount > 0 && (
        <span className="absolute bottom-1.5 left-1.5 px-[5px] py-[2px] rounded-[4px] bg-black/75 text-white text-[10px] font-medium leading-tight flex items-center gap-0.5">
          <Eye className="w-[10px] h-[10px]" />
          {formatCount(engagementCount)}
        </span>
      )}
    </button>
  );
});
