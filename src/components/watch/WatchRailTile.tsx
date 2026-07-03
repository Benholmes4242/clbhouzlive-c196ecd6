import { openWithOrigin } from '@/lib/openWithOrigin';
import { useRef, useCallback, useMemo } from 'react';
import { Heart } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { Pin } from './proshop/Pin';
import DecodedImage from './shared/DecodedImage';
import { getThumbnailUrl } from '@/media/utils/thumbnail';
import { buildLqipUrl } from '@/utils/mediaThumbs';
import { shouldUseLqip } from '@/utils/lqipQueue';
import Pressable from '@/components/ui/Pressable';



interface WatchRailTileProps {
  post: FeedPost;
  index: number;
  allPosts: FeedPost[];
  /** When provided, renders a large outlined rank number bottom-left. */
  rank?: number;
  /** Tile width. Defaults to 200. Accepts a CSS length string for responsive layouts. */
  width?: number | string;
  /**
   * Set of post IDs the current user has already watched.
   * When provided, the NEW badge is suppressed for posts in this set.
   * Optional → falls back to global time-only behavior.
   */
  viewedPostIds?: Set<string>;
  /** Tile aspect ratio. Defaults to '3/4' (portrait). Pass '1/1' for square. */
  aspectRatio?: string;
  /** Border radius in px. Defaults to 6. */
  radius?: number;
  /** Fires once the tile's thumbnail bitmap is ready (used to gate coordinated reveal). */
  onDecoded?: () => void;
  /** When set, request a sized thumbnail variant. */
  thumbHeightPx?: number;
  /**
   * Rail-coordinator-owned autoplay slot. When true, mount + play muted looped
   * video; when false, pause and hide video (poster stays visible under).
   * Absent → no autoplay attempted (used by lists that don't coordinate).
   */
  isAutoplayActive?: boolean;
}


const NEW_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24h
const POPULAR_REVIEW_LIKES = 25;

function deriveSurfacingReason(
  post: FeedPost,
  viewedPostIds?: Set<string>,
): string | null {
  const ageMs = Date.now() - new Date(post.createdAt).getTime();
  const isFresh = ageMs < NEW_THRESHOLD_MS;
  const alreadyViewed = viewedPostIds?.has(post.id) ?? false;
  if (isFresh && !alreadyViewed) return 'NEW';
  if (post.isReview && post.likeCount >= POPULAR_REVIEW_LIKES) return 'POPULAR REVIEW';
  return null;
}

/**
 * Canonical horizontal-rail tile for the Watch surface.
 * Autoplay is externally coordinated: only plays when `isAutoplayActive`
 * is true. Muted + looped for as long as the slot is held.
 */
export default function WatchRailTile({
  post,
  index,
  allPosts,
  rank,
  width = 200,
  viewedPostIds,
  aspectRatio = '3/4',
  radius = 6,
  onDecoded,
  thumbHeightPx,
  isAutoplayActive = false,
}: WatchRailTileProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const media = post.mediaItems[0];
  const rawThumb = media?.thumbnailUrl || media?.imageUrl || '';
  const thumb = useMemo(() => {
    if (!rawThumb || !thumbHeightPx) return rawThumb;
    return getThumbnailUrl({ imageUrl: rawThumb, height: thumbHeightPx });
  }, [rawThumb, thumbHeightPx]);
  const hlsUrl = media?.hlsUrl || '';

  // [VIDEOSTUB] Video mount/HLS attach removed — poster-only rail tile.

  const handleClick = useCallback(() => {
    openWithOrigin({
      posts: allPosts,
      index,
      originEl: cardRef.current,
      posterUrl: thumb ?? null,
      handOffUrls: [hlsUrl],
    });
  }, [allPosts, index, thumb, hlsUrl]);

  const surfacingReason = useMemo(
    () => deriveSurfacingReason(post, viewedPostIds),
    [post, viewedPostIds],
  );

  return (
    <Pressable
      as="div"
      variant="card"
      onPress={handleClick}
      ref={cardRef as any}
      data-rail-tile-index={index}
      data-post-id={post.id}
      style={{
        flexShrink: 0,
        position: 'relative',
        width,
        borderRadius: radius,
        overflow: 'hidden',
        aspectRatio,
      }}
      innerStyle={{ position: 'absolute', inset: 0 }}
    >

      {/* Poster — decode-gated for coordinated reveal. */}
      <DecodedImage
        src={thumb}
        alt=""
        loading="lazy"
        onDecoded={onDecoded}
        lqipSrc={shouldUseLqip(index, 3) ? buildLqipUrl(thumb) : null}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />

      {/* Gradient */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.1) 45%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* Surfacing reason */}
      {surfacingReason && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            zIndex: 3,
            maxWidth: 'calc(100% - 16px)',
            pointerEvents: 'none',
          }}
        >
          <Pin variant="amber" size="sm">{surfacingReason}</Pin>
        </div>
      )}

      {/* Optional rank */}
      {typeof rank === 'number' && (
        <span
          style={{
            position: 'absolute',
            top: 2,
            left: 10,
            fontSize: 76,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: '-0.04em',
            color: 'rgba(255,255,255,0.32)',
            textShadow: '0 2px 12px rgba(0,0,0,0.18)',
            pointerEvents: 'none',
            zIndex: 3,
            userSelect: 'none',
          }}
        >
          {rank}
        </span>
      )}

      {/* Likes */}
      {(post.likeCount ?? 0) > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(255,255,255,0.95)',
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            zIndex: 3,
          }}
        >
          <Heart
            style={{ width: 12, height: 12, color: '#F7931E', fill: '#F7931E' }}
            strokeWidth={1.8}
          />
          {post.likeCount}
        </div>
      )}
    </Pressable>

  );
}
