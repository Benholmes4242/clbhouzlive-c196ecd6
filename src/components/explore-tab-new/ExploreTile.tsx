import { memo, useRef } from 'react';
import { Film } from 'lucide-react';
import { Pin } from '@/components/watch/proshop/Pin';
import type { FeedPost } from '@/components/media-system/types/media';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { useRailLane } from '@/video/useRailLane';

interface ExploreTileProps {
  post: FeedPost;
  index: number;
  allPosts?: FeedPost[];
  fetchNextPage?: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  /** True when this tile is the autoplay winner for the Explore grid. */
  active?: boolean;
  variant?: 'tile' | 'hero';
  feature?: boolean;
}

function ExploreTileInner({
  post,
  index,
  allPosts,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  active = false,
}: ExploreTileProps) {
  // ALL hooks must run unconditionally, before any early return.
  const tileRef = useRef<HTMLButtonElement>(null);
  const media = post.mediaItems[0];
  const isVideo = media?.type === 'video';
  const hlsUrl = (media as any)?.hlsUrl as string | undefined;
  const posterSrc = media?.thumbnailUrl || media?.imageUrl || '';
  const isVideoLane = isVideo && !!hlsUrl;
  const ownerKey = isVideoLane ? `${post.id}:0` : null;
  const { hostRef: laneHostRef, ready: laneReady } = useRailLane({
    ownerKey,
    active: active && isVideoLane,
    hlsUrl: isVideoLane ? hlsUrl! : null,
    posterUrl: posterSrc || null,
    postId: post.id,
  });

  if (!media) return null;

  const courseName = post.courseName || post.review?.courseName;

  const handleTap = () => {
    const posts = allPosts ?? [post];
    openWithOrigin({
      posts,
      index,
      originEl: tileRef.current,
      posterUrl: posterSrc || null,
      railOwnerKey: ownerKey,
      mediaId: media.id ?? null,
      openedFrom: 'explore',
      options: {
        hasNextPage: hasNextPage ?? false,
        fetchNextPage: hasNextPage ? fetchNextPage : undefined,
        isFetchingNextPage: isFetchingNextPage ?? false,
      },
    });
  };

  return (
    <button
      ref={tileRef}
      type="button"
      onClick={handleTap}
      aria-label={courseName ? `View ${courseName}` : 'View post'}
      className="absolute inset-0 w-full h-full overflow-hidden bg-muted focus:outline-none"
      style={{ borderRadius: 'inherit' }}
      data-explore-index={index}
      data-watch-tile-index={index}
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

      {isVideoLane && (
        <div
          ref={laneHostRef}
          aria-hidden
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1,
            opacity: laneReady ? 1 : 0,
            transition: 'opacity 140ms linear',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Video play affordance — shown when tile is NOT autoplaying (parity with Watch/course tiles). */}
      {isVideo && !active && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width={12} height={12} viewBox="0 0 12 12" fill="#fff">
              <path d="M3 1.5 L10 6 L3 10.5 Z" />
            </svg>
          </div>
        </div>
      )}

      {/* Fallback when no poster and it's an image with a broken URL */}
      {!posterSrc && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Film style={{ width: 24, height: 24, color: 'rgba(15,23,42,0.3)' }} />
        </div>
      )}

      {courseName && (
        <div
          style={{
            position: 'absolute',
            top: 6,
            left: '50%',
            transform: 'translateX(-50%)',
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
