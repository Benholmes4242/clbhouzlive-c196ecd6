import React from 'react';
import { Eye, Film } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';

function formatDuration(seconds?: number): string {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function abbreviateCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface WatchTileProps {
  post: FeedPost;
  index: number;
}

const WatchTile: React.FC<WatchTileProps> = ({ post, index }) => {
  const media = post.mediaItems[0];
  const thumbnailUrl = media?.thumbnailUrl;
  const duration = media?.duration;
  const engagement = post.likeCount + post.commentCount + post.shareCount;

  return (
    <div
      data-watch-index={index}
      className="relative aspect-[9/16] overflow-hidden rounded-[4px] cursor-pointer active:scale-[0.97]"
      style={{ transition: 'transform 100ms ease' }}
      onClick={() => {
        console.log('[WatchPage] Tile tapped:', { postId: post.id, index });
      }}
    >
      {/* Poster or placeholder */}
      {thumbnailUrl ? (
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Film className="w-8 h-8 text-muted-foreground" />
        </div>
      )}

      {/* Bottom gradient */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{
          height: '40%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 100%)',
        }}
      />

      {/* Duration badge */}
      {duration != null && duration > 0 && (
        <div
          className="absolute bottom-1.5 right-1.5 z-10 rounded-[4px] flex items-center"
          style={{
            background: 'rgba(0,0,0,0.75)',
            padding: '2px 5px',
          }}
        >
          <span className="text-[11px] font-semibold text-white tracking-[0.02em]">
            {formatDuration(duration)}
          </span>
        </div>
      )}

      {/* Engagement badge */}
      {engagement > 0 && (
        <div
          className="absolute bottom-1.5 left-1.5 z-10 rounded-[4px] flex items-center gap-[3px]"
          style={{
            background: 'rgba(0,0,0,0.75)',
            padding: '2px 5px',
          }}
        >
          <Eye className="w-[10px] h-[10px] text-white" />
          <span className="text-[11px] font-medium text-white">
            {abbreviateCount(engagement)}
          </span>
        </div>
      )}
    </div>
  );
};

export default WatchTile;
