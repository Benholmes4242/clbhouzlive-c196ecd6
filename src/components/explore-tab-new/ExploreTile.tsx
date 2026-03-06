import { memo } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { formatDuration } from '@/utils/formatDuration';

interface ExploreTileProps {
  post: FeedPost;
  index: number;
}

function ExploreTileInner({ post, index }: ExploreTileProps) {
  const media = post.mediaItems[0];
  if (!media) return null;

  const isVideo = media.type === 'video';
  const posterSrc = media.thumbnailUrl || media.imageUrl || '';
  const duration = media.duration;
  const isReview = post.isReview && post.review;

  const handleTap = () => {
    // Phase 5: will open fullscreen player
  };

  return (
    <button
      type="button"
      onClick={handleTap}
      className="relative aspect-[4/5] rounded-[4px] overflow-hidden bg-muted focus:outline-none"
      data-explore-index={index}
    >
      {posterSrc && (
        <img
          src={posterSrc}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
        />
      )}

      {/* Duration badge — videos, bottom-right */}
      {isVideo && duration != null && duration > 0 && (
        <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-white text-[11px] font-semibold leading-none">
          {formatDuration(duration)}
        </span>
      )}

      {/* Review rating badge — bottom-left */}
      {isReview && post.review && (
        <div className="absolute bottom-1.5 left-1.5 flex flex-col gap-0.5 items-start">
          <span className="px-1.5 py-0.5 rounded bg-amber-500/90 text-white text-[11px] font-semibold leading-none">
            ⭐ {post.review.rating.toFixed(1)}
          </span>
          {post.review.courseName && (
            <span className="px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-white text-[10px] leading-none line-clamp-1 max-w-[90%]">
              {post.review.courseName}
            </span>
          )}
        </div>
      )}

      {/* Engagement count — non-reviews, bottom-left */}
      {!isReview && post.likeCount > 0 && (
        <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/50 backdrop-blur-sm text-white text-[11px] font-semibold leading-none">
          ♥ {post.likeCount}
        </span>
      )}
    </button>
  );
}

export const ExploreTile = memo(ExploreTileInner);
