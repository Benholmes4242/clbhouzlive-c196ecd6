import React, { useEffect, useMemo, useRef } from 'react';
import { Film, Heart } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { openWithOrigin } from '@/lib/openWithOrigin';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import DecodedImage from './shared/DecodedImage';
import { buildLqipUrl } from '@/utils/mediaThumbs';
import { shouldUseLqip } from '@/utils/lqipQueue';
import Pressable from '@/components/ui/Pressable';
import { useRailLane } from '@/video/useRailLane';



function abbreviateCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

interface WatchTileProps {
  post: FeedPost;
  index: number;
  allPosts?: FeedPost[];
  /** Fired once the tile's thumbnail has been decoded and painted. */
  onDecoded?: () => void;
  /**
   * Watch-surface-coordinated autoplay slot. When true, rent a rail lane and
   * play muted+looped over the poster; when false, poster only.
   */
  isAutoplayActive?: boolean;
}

/**
 * Masonry tile for the Watch "Clips to explore" grid. Fills its parent
 * (which controls aspect ratio based on real media width/height) and renders
 * the standard short-form overlay: top scrim, like top-right, squircle +
 * creator name bottom-left. Tap → fullscreen player. Uses the shared
 * decode-gated <DecodedImage>.
 */
const WatchTile: React.FC<WatchTileProps> = ({ post, index, allPosts, onDecoded, isAutoplayActive = false }) => {
  const media = post.mediaItems[0];
  const thumbnailUrl = media?.thumbnailUrl;
  const posterUrl = (media as any)?.posterUrl || (media as any)?.poster || undefined;
  const hlsUrl: string | undefined = (media as any)?.hlsUrl;
  const likeCount = post.likeCount ?? 0;
  const rootRef = useRef<HTMLElement>(null);

  const isVideo = !!media && media.type === 'video' && !!hlsUrl;
  const ownerKey = isVideo ? `${post.id}:0` : null;
  const { hostRef: laneHostRef, ready: laneReady } = useRailLane({
    ownerKey,
    active: !!isAutoplayActive && isVideo,
    hlsUrl: isVideo ? hlsUrl! : null,
    posterUrl: thumbnailUrl ?? posterUrl ?? null,
    postId: post.id,
  });

  const handleClick = () => {
    openWithOrigin({
      openedFrom: 'watch',
      posts: allPosts ?? [post],
      index,
      originEl: rootRef.current as HTMLElement | null,
      posterUrl: thumbnailUrl ?? posterUrl ?? null,
      railOwnerKey: ownerKey,
    });
  };


  const creator = post.displayName || post.username || '';

  // No thumbnail → unblock the reveal immediately; there's nothing to decode.
  const notifiedNoThumbRef = useRef(false);
  useEffect(() => {
    if (!thumbnailUrl && !notifiedNoThumbRef.current) {
      notifiedNoThumbRef.current = true;
      onDecoded?.();
    }
  }, [thumbnailUrl, onDecoded]);

  return (
    <Pressable
      ref={rootRef}
      as="div"
      variant="card"
      onPress={handleClick}
      data-watch-tile-index={index}
      data-post-id={post.id}
      className="relative w-full h-full overflow-hidden select-none bg-muted/40"
      innerStyle={{ position: 'relative', width: '100%', height: '100%' }}
      style={
        posterUrl
          ? {
              backgroundImage: `url(${posterUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }
          : undefined
      }
    >

      {thumbnailUrl ? (
        <DecodedImage
          src={thumbnailUrl}
          alt=""
          loading="lazy"
          onDecoded={onDecoded}
          lqipSrc={shouldUseLqip(index, 6) ? buildLqipUrl(thumbnailUrl) : null}
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: 'cover' }}
        />






      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Film className="w-8 h-8 text-muted-foreground" />
        </div>
      )}

      {/* Rail-lane video host — mounted only when we hold a rented lane. */}
      {isVideo && (
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

      {/* Top scrim */}
      <div
        aria-hidden
        className="absolute top-0 left-0 right-0 pointer-events-none"
        style={{
          height: '44%',
          background: 'linear-gradient(to top, transparent 0%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Like — top-right */}
      {likeCount > 0 && (
        <div
          className="absolute flex items-center"
          style={{
            top: 7,
            right: 7,
            gap: 3,
            color: '#fff',
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}
        >
          <Heart size={12} strokeWidth={0} style={{ color: '#F7931E', fill: '#F7931E' }} />
          <span style={{ fontSize: 10.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {abbreviateCount(likeCount)}
          </span>
        </div>
      )}

      {/* Creator — bottom-left */}
      <div
        className="absolute flex items-center"
        style={{
          bottom: 7,
          left: 7,
          right: 7,
          gap: 5,
          pointerEvents: 'none',
        }}
      >
        <SquircleAvatar size={17} src={post.avatarUrl} alt={creator} hairlineRing />
        <span
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: '#fff',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
            minWidth: 0,
          }}
        >
          {creator}
        </span>
      </div>
    </Pressable>

  );
};

export default WatchTile;
