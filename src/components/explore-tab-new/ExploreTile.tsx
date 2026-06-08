import { memo, useEffect, useRef } from 'react';
import { Pin } from '@/components/watch/proshop/Pin';
import type { FeedPost } from '@/components/media-system/types/media';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import clbhouzLogo from '@/assets/clbhouz-logo.png';

interface ExploreTileProps {
  post: FeedPost;
  index: number;
  allPosts?: FeedPost[];
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  variant?: 'tile' | 'hero';
  feature?: boolean;
}

function ExploreTileInner({ post, index, allPosts, variant = 'tile', feature = false }: ExploreTileProps) {
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
  

  const { open } = useFullscreenFeedStore();

  const handleTap = () => {
    open(allPosts ?? [post], index);
  };

  return (
    <button
      ref={tileRef}
      type="button"
      onClick={handleTap}
      aria-label={courseName ? `View ${courseName}` : 'View post'}
      className="absolute inset-0 w-full h-full overflow-hidden bg-muted focus:outline-none"
      style={{ borderRadius: 0 }}
      data-explore-index={index}
    >
      {posterSrc && (
        <img
          src={posterSrc}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover' }}
        />
      )}


      {courseName && (
        <div
          style={{
            position: 'absolute', top: 6,
            left: '50%', transform: 'translateX(-50%)',
            maxWidth: 'calc(100% - 24px)',
            zIndex: 10,
            pointerEvents: 'none',
          }}
        >
          <Pin size="grid" variant="dark">{courseName}</Pin>
        </div>
      )}
    </button>
  );
}

export const ExploreTile = memo(ExploreTileInner);
