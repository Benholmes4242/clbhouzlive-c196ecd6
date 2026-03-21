import { memo, useEffect, useRef } from 'react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';

interface ExploreTileProps {
  post: FeedPost;
  index: number;
  allPosts?: FeedPost[];
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
}

function ExploreTileInner({ post, index, allPosts, fetchNextPage, hasNextPage, isFetchingNextPage }: ExploreTileProps) {
  const media = post.mediaItems[0];
  const tileRef = useRef<HTMLButtonElement>(null);
  const hlsUrl = post.mediaItems?.[0]?.hlsUrl;

  useEffect(() => {
    const el = tileRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          // TODO Brief 3: onViewPreload
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hlsUrl]);

  if (!media) return null;

  const posterSrc = media.thumbnailUrl || media.imageUrl || '';
  const courseName = post.courseName || post.review?.courseName;
  const rating = post.review?.rating;

  const handleTap = () => {
    if (allPosts) {
      // TODO Brief 3: fullscreen feed open
    }
  };

  return (
    <button
      ref={tileRef}
      type="button"
      onClick={handleTap}
      
      aria-label={courseName ? `View ${courseName}` : 'View post'}
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

      {rating != null && rating > 0 && (
        <span
          className="absolute top-2 right-2 rounded-full liquid-glass flex items-center gap-1 text-[13px] font-semibold text-white leading-none"
          style={{ padding: '4px 9px' }}
        >
          <img src="/images/brand/clubhouz-mark-white.svg" alt="" className="w-3 h-3" />
          {rating.toFixed(1)}
        </span>
      )}

      {courseName && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent px-2 py-2">
          <p className="text-center text-[11px] font-semibold text-white line-clamp-1">
            {courseName}
          </p>
        </div>
      )}
    </button>
  );
}

export const ExploreTile = memo(ExploreTileInner);
