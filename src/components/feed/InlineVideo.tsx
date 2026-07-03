/**
 * InlineVideo — STUBBED (video teardown Stage B).
 *
 * Poster-only chassis. No <video>, no HLS pool, no MediaRuntime registration.
 * Renders the tile's poster/thumbnail as a plain <img> so the feed layout,
 * FLIP transitions, and tap-to-open handlers keep working while the engine
 * is torn down. Public props unchanged.
 */
import React, { useEffect } from 'react';
import type { MediaItem } from '@/components/media-system/types/media';

interface Props {
  item: MediaItem;
  isActive: boolean;
  isNear: boolean;
  feedIndex?: number;
  objectFit?: 'cover' | 'contain';
  /** Fires once so callers waiting on paint-ready don't stall. */
  onFirstFrameReady?: () => void;
}

function resolvePosterUrl(item: MediaItem): string {
  const anyItem = item as any;
  return (
    anyItem.thumbnailUrl ||
    anyItem.posterUrl ||
    anyItem.poster ||
    anyItem.imageUrl ||
    anyItem.previewUrl ||
    ''
  );
}

export const InlineVideo: React.FC<Props> = ({
  item,
  objectFit = 'cover',
  onFirstFrameReady,
}) => {
  const poster = resolvePosterUrl(item);

  useEffect(() => {
    if (!onFirstFrameReady) return;
    const t = setTimeout(() => onFirstFrameReady(), 0);
    return () => clearTimeout(t);
  }, [onFirstFrameReady]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        background: '#05080F',
        overflow: 'hidden',
      }}
    >
      {poster ? (
        <img
          src={poster}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit,
            objectPosition: 'center',
            display: 'block',
          }}
        />
      ) : null}
    </div>
  );
};

export default InlineVideo;
