import { memo, useEffect, useRef } from 'react';
import { MapPin } from 'lucide-react';
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
  const rating = post.review?.rating;

  const { open } = useFullscreenFeedStore();

  const handleTap = () => {
    open(allPosts ?? [post], index);
  };

  const scale = feature || variant === 'hero' ? 1.15 : 1;
  const ratingFs = 12 * scale;
  const ratingIcon = 12 * scale;
  const ratingPadY = 4 * scale;
  const ratingPadX = 8 * scale;
  const pinFs = 10 * scale;
  const pinIconFs = 9 * scale;
  const pinPadY = 3 * scale;
  const pinPadX = 7 * scale;
  const pinGap = 4 * scale;
  const pinBottom = 7 * scale;

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

      {rating != null && rating > 0 && (
        <span
          className="absolute flex items-center leading-none"
          style={{
            top: 8, right: 8, gap: 4 * scale,
            padding: `${ratingPadY}px ${ratingPadX}px`,
            borderRadius: 9999,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          <img src={clbhouzLogo} alt="" style={{ width: ratingIcon, height: ratingIcon, objectFit: 'contain' }} />
          <span style={{ fontSize: ratingFs, fontWeight: 700, color: '#fff' }}>{rating.toFixed(1)}</span>
        </span>
      )}

      {courseName && (
        <div
          style={{
            position: 'absolute', bottom: pinBottom, left: 0, right: 0,
            display: 'flex', justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              display: 'inline-flex', alignItems: 'center', gap: pinGap,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 9999, padding: `${pinPadY}px ${pinPadX}px`,
              maxWidth: 'calc(100% - 14px)',
            }}
          >
            <span style={{ fontSize: pinIconFs, flexShrink: 0, lineHeight: 1 }}>📍</span>
            <span style={{
              fontSize: pinFs, fontWeight: 600, color: '#fff',
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
