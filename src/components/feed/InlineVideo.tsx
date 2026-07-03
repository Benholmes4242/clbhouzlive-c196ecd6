/**
 * InlineVideo — feed video shell wired to the VideoEngine `feed-active` lane.
 *
 * Renders a poster underneath a lane host div. When `isActive` is true, the
 * hook mounts the engine's `feed-active` element into the host and loads the
 * hls source; on de-activation it unmounts (poster remains visible).
 *
 * Core rule (VideoEngine): one <video> = one hls instance = one owner for
 * life. This component never creates elements — the engine owns them and
 * appendChild's them into `hostRef` on demand.
 */
import React, { useEffect, useRef } from 'react';
import type { MediaItem } from '@/components/media-system/types/media';
import { useVideoLane } from '@/video/useVideoLane';
import { VideoEngine } from '@/video/VideoEngine';
import { useClubhouseStore } from '@/store/clubhouseStore';

interface Props {
  item: MediaItem;
  isActive: boolean;
  isNear: boolean;
  feedIndex?: number;
  objectFit?: 'cover' | 'contain';
  /** Post id — required for two-way resume + lastPos tracking. */
  postId?: string | null;
  /** Fires once when the poster image has painted. */
  onFirstFrameReady?: () => void;
}

export const InlineVideo: React.FC<Props> = ({
  item,
  isActive,
  postId,
  objectFit = 'cover',
  onFirstFrameReady,
}) => {
  const posterUrl =
    (item as any).thumbnailUrl ||
    (item as any).imageUrl ||
    '';
  const hlsUrl = (item as any).hlsUrl as string | undefined;
  const firedRef = useRef(false);
  const isMuted = useClubhouseStore((s) => s.isMuted);

  // Resume from engine.lastPos when we (re)activate; -1 tells hls.js "use
  // manifest default" for first-load, positive value seeks to that time.
  const startPosition = React.useMemo(() => {
    if (!isActive || !postId) return -1;
    const t = VideoEngine.getLastPos(postId);
    return t > 0 ? t : -1;
  }, [isActive, postId]);

  const lane = useVideoLane('feed-active', {
    hlsUrl: isActive ? hlsUrl ?? null : null,
    posterUrl: posterUrl || null,
    startPosition,
    active: isActive,
    muted: isMuted,
    postId,
  });

  // Emit V1_TILE_RESUME once when this active tile paints its first frame.
  useEffect(() => {
    if (!isActive || !postId) return;
    if (lane.snapshot.firstFrame) {
      VideoEngine.trace('V1_TILE_RESUME', {
        postId,
        videoTime: lane.snapshot.currentTime,
      });
    }
  }, [isActive, postId, lane.snapshot.firstFrame, lane.snapshot.currentTime]);

  // Poster paint-ready signal for surfaces that gate on it.
  useEffect(() => {
    if (!posterUrl || firedRef.current) return;
    firedRef.current = true;
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
      {/* Lane host — engine appendChild's the <video> here when isActive. */}
      <div
        ref={lane.hostRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          // Fade in the video over the poster on first frame.
          opacity: isActive && lane.snapshot.firstFrame ? 1 : 0,
          transition: 'opacity 120ms linear',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
};

InlineVideo.displayName = 'InlineVideo';
