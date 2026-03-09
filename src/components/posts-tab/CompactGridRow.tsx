import React from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { Play, Star } from 'lucide-react';
import { useFullscreenFeed } from '@/components/fullscreen-feed/hooks/useFullscreenFeed';

interface CompactGridRowProps {
  posts: FeedPost[];
  startIndex: number;
  globalIndices?: number[];
  allPosts?: FeedPost[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const CompactTile: React.FC<{ post: FeedPost; globalIndex: number; allPosts?: FeedPost[] }> = ({ post, globalIndex, allPosts }) => {
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
      onClick={() => {
        if (allPosts) {
          useFullscreenFeed.getState().open({
            posts: allPosts,
            startIndex: globalIndex,
            sourceId: 'posts',
          });
        }
      }}
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

      {/* Duration badge — bottom right (matches WatchTile) */}
      {isVideo && duration != null && duration > 0 && (
        <div
          className="absolute bottom-1.5 right-1.5 z-10 rounded-[4px] flex items-center"
          style={{
            background: 'rgba(0, 0, 0, 0.35)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
            padding: '2px 5px',
          }}
        >
          <span className="text-[11px] font-semibold text-white tracking-[0.02em]">
            {formatDuration(duration)}
          </span>
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

      {/* Like count — bottom left, amber when liked */}
      {post.likeCount > 0 && (
        <div className="absolute bottom-1.5 left-1.5 flex items-center gap-0.5 z-10">
          <span className="flex items-center gap-0.5 text-[10px] font-semibold text-[#f59e0b] drop-shadow-md">
            ♥ {formatCompact(post.likeCount)}
          </span>
        </div>
      )}
    </div>
  );
};

export const CompactGridRow: React.FC<CompactGridRowProps> = ({ posts, startIndex, globalIndices, allPosts }) => {
  return (
    <div className="grid grid-cols-3 gap-[2px]">
      {posts.map((post, i) => (
        <CompactTile
          key={post.id}
          post={post}
          globalIndex={globalIndices ? globalIndices[i] : startIndex + i}
          allPosts={allPosts}
        />
      ))}
    </div>
  );
};
