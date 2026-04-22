import { memo, useEffect, useRef } from 'react';
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
          className="absolute top-2 right-2 flex items-center gap-1 leading-none"
          style={{
            padding: '4px 8px',
            borderRadius: 9999,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <img src={clbhouzLogo} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{rating.toFixed(1)}</span>
        </span>
      )}

      {courseName && (
        <div
          style={{
            position: 'absolute', bottom: 7, left: 0, right: 0,
            display: 'flex', justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 9999, padding: '3px 7px',
              maxWidth: 'calc(100% - 14px)',
            }}
          >
            <span style={{ fontSize: 9, flexShrink: 0, lineHeight: 1 }}>📍</span>
            <span style={{
              fontSize: 10, fontWeight: 600, color: '#fff',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {courseName}
            </span>
          </div>
        </div>
      )}
    </button>
  );
}

export const ExploreTile = memo(ExploreTileInner);
