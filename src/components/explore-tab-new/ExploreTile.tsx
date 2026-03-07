import { memo } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';

interface ExploreTileProps {
  post: FeedPost;
  index: number;
}

function ExploreTileInner({ post, index }: ExploreTileProps) {
  const media = post.mediaItems[0];
  if (!media) return null;

  const posterSrc = media.thumbnailUrl || media.imageUrl || '';
  const courseName = post.courseName || post.review?.courseName;
  const rating = post.review?.rating;

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

      {/* Rating badge — top right */}
      {rating != null && rating > 0 && (
        <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-amber-500/90 text-white text-[11px] font-semibold leading-none">
          ⭐ {rating.toFixed(1)}
        </span>
      )}

      {/* Course name — bottom center on gradient */}
      {courseName && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-2 py-2">
          <p className="text-center text-[11px] font-semibold text-white line-clamp-1">
            {courseName}
          </p>
        </div>
      )}
    </button>
  );
}

export const ExploreTile = memo(ExploreTileInner);
