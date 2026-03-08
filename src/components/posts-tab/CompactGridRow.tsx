import React from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { Play, Star } from 'lucide-react';

interface CompactGridRowProps {
  posts: FeedPost[];
  startIndex: number;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const CompactTile: React.FC<{ post: FeedPost; globalIndex: number }> = ({ post, globalIndex }) => {
  const firstMedia = post.mediaItems[0];
  const isVideo = firstMedia?.type === 'video';
  const thumbnailUrl = firstMedia?.thumbnailUrl || firstMedia?.imageUrl;
  const duration = firstMedia?.duration;
  const hasReview = post.isReview && post.review;

  return (
    <div
      className="relative aspect-[4/5] rounded-[4px] overflow-hidden bg-muted cursor-pointer"
      data-posts-tile-index={globalIndex}
      data-hls-url={firstMedia?.hlsUrl || ''}
      onClick={() => { /* TODO: wire to player */ }}
    >
      {/* Poster image */}
      {thumbnailUrl && (
        <img
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover z-0"
          loading="lazy"
        />
      )}

      {/* Video play icon */}
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center z-2 pointer-events-none">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.4)' }}
          >
            <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
          </div>
        </div>
      )}

      {/* Duration badge — bottom right */}
      {isVideo && duration != null && duration > 0 && (
        <div
          className="absolute bottom-1.5 right-1.5 px-1 py-px rounded text-[9px] font-medium text-white z-3"
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

      {/* Review rating badge */}
      {hasReview && post.review && (
        <div
          className="absolute bottom-1.5 right-1.5 flex items-center gap-0.5 px-1 py-px rounded text-[9px] font-medium text-white z-3"
          style={{
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
          {post.review.rating.toFixed(1)}
        </div>
      )}

      {/* Creator avatar — bottom left */}
      {post.avatarUrl && (
        <img
          src={post.avatarUrl}
          alt=""
          className="absolute bottom-1.5 left-1.5 w-5 h-5 rounded-full object-cover border border-white/20 z-3"
          loading="lazy"
        />
      )}
    </div>
  );
};

export const CompactGridRow: React.FC<CompactGridRowProps> = ({ posts, startIndex }) => {
  return (
    <div className="grid grid-cols-3 gap-[2px]">
      {posts.map((post, i) => (
        <CompactTile
          key={post.id}
          post={post}
          globalIndex={startIndex + i}
        />
      ))}
    </div>
  );
};
