/**
 * InlineVideo — POSTER-ONLY chassis (Stage B3 video teardown).
 *
 * Public API preserved (Props, named export, displayName) so all callers
 * — MediaCarousel, FeedCard, LightFeedCard — keep compiling. No <video>,
 * no HLS/pool/runtime/decoder wiring, no autoplay. Just the thumbnail.
 */
import React, { useEffect, useRef } from 'react';
import type { MediaItem } from '@/components/media-system/types/media';

interface Props {
  item: MediaItem;
  isActive: boolean;
  isNear: boolean;
  feedIndex?: number;
  objectFit?: 'cover' | 'contain';
  /** Fires once when the poster image has painted. */
  onFirstFrameReady?: () => void;
}

export const InlineVideo: React.FC<Props> = ({
  item,
  objectFit = 'cover',
  onFirstFrameReady,
}) => {
  const posterUrl =
    (item as any).thumbnailUrl ||
    (item as any).imageUrl ||
    '';
  const firedRef = useRef(false);

  // If poster is already cached, fire the paint-ready signal immediately.
  useEffect(() => {
    if (!posterUrl || firedRef.current) return;
    firedRef.current = true;
    // Defer to next tick so callers can settle mount effects.
    const id = requestAnimationFrame(() => onFirstFrameReady?.());
    return () => cancelAnimationFrame(id);
  }, [posterUrl, onFirstFrameReady]);

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: '#0a0a0a' }}>
      {posterUrl && (
        <img
          src={posterUrl}
          alt=""
          aria-hidden
          loading="lazy"
          onLoad={() => {
            if (firedRef.current) return;
            firedRef.current = true;
            onFirstFrameReady?.();
          }}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit,
            display: 'block',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
};

InlineVideo.displayName = 'InlineVideo';
