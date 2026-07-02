import React, { useEffect, useRef, useState } from 'react';
import { Film, Heart } from 'lucide-react';
import type { FeedPost } from '@/components/media-system/types/media';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';

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
}

/**
 * Masonry tile for the Watch "Clips to explore" grid. Fills its parent
 * (which controls aspect ratio based on real media width/height) and renders
 * the standard short-form overlay: top scrim, like top-right, squircle +
 * creator name bottom-left. Tap → fullscreen player.
 *
 * Reveal is decode-gated: the <img> mounts at opacity 0, we await
 * img.decode(), then fade in over ~120ms. This eliminates the classic
 * broken→pop transition and matches the ThumbnailSkeleton polish used
 * elsewhere in the app.
 */
const WatchTile: React.FC<WatchTileProps> = ({ post, index, allPosts, onDecoded }) => {
  const media = post.mediaItems[0];
  const thumbnailUrl = media?.thumbnailUrl;
  const posterUrl = (media as any)?.posterUrl || (media as any)?.poster || undefined;
  const likeCount = post.likeCount ?? 0;
  const { open } = useFullscreenFeedStore();

  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const notifiedRef = useRef(false);

  const notifyDecoded = () => {
    if (notifiedRef.current) return;
    notifiedRef.current = true;
    onDecoded?.();
  };

  useEffect(() => {
    if (!thumbnailUrl) {
      // No image to decode — count as ready so the page can settle.
      notifyDecoded();
      return;
    }
    const img = imgRef.current;
    if (!img) return;
    let cancelled = false;

    const reveal = () => {
      if (cancelled) return;
      setLoaded(true);
      notifyDecoded();
    };

    if (img.complete && img.naturalWidth > 0) {
      reveal();
      return;
    }

    if (typeof img.decode === 'function') {
      img.decode().then(reveal).catch(() => {
        // decode() rejects on some browsers for cross-origin / animated;
        // fall back to onLoad path.
      });
    }

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thumbnailUrl]);

  const handleClick = () => {
    open(allPosts ?? [post], index);
  };

  const creator = post.displayName || post.username || '';

  return (
    <div
      data-watch-index={index}
      className="relative w-full h-full overflow-hidden cursor-pointer select-none bg-muted/40"
      onClick={handleClick}
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
        <img
          ref={imgRef}
          src={thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
          onLoad={() => {
            setLoaded(true);
            notifyDecoded();
          }}
          style={{
            opacity: loaded ? 1 : 0,
            transition: 'opacity 120ms ease-out',
          }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-muted">
          <Film className="w-8 h-8 text-muted-foreground" />
        </div>
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
        <SquircleAvatar size={17} src={post.avatarUrl} alt={creator} hideRing />
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
    </div>
  );
};

export default WatchTile;
