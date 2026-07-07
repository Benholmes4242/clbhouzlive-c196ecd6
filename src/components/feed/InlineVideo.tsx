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
import { originHostRegistry } from '@/video/originHostRegistry';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { MuteToggle } from '@/components/feed/MuteToggle';


interface Props {
  item: MediaItem;
  isActive: boolean;
  isNear: boolean;
  feedIndex?: number;
  objectFit?: 'cover' | 'contain';
  /** Post id — required for two-way resume + lastPos tracking. */
  postId?: string | null;
  /**
   * Media-level ownership key. Should be `${postId}:${mediaIndex}` (single
   * video → `${postId}:0`). Must be non-null for any real feed card so the
   * VideoEngine owner-guard can reject stale outgoing cards on scroll.
   */
  ownerKey?: string | null;
  /** Fires once when the poster image has painted. */
  onFirstFrameReady?: () => void;
}

export const InlineVideo: React.FC<Props> = ({
  item,
  isActive,
  postId,
  ownerKey,
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

  // Fallback ownership key so single-video callers that only pass postId
  // still get a non-null owner (closes the null-caller pause hole).
  const resolvedOwnerKey = ownerKey ?? (postId ? `${postId}:0` : null);

  // Resume from engine.lastPos when we (re)activate; -1 tells hls.js "use
  // manifest default" for first-load, positive value seeks to that time.
  // Read via ownerKey so the borrow path (play() stamps ownerKey, onTime
  // writes lastPos under lane.postId=ownerKey) resolves symmetrically.
  const startPosition = React.useMemo(() => {
    if (!isActive || !resolvedOwnerKey) return -1;
    const t = VideoEngine.getLastPos(resolvedOwnerKey);
    return t > 0 ? t : -1;
  }, [isActive, resolvedOwnerKey]);

  const lane = useVideoLane('feed-active', {
    hlsUrl: isActive ? hlsUrl ?? null : null,
    posterUrl: posterUrl || null,
    startPosition,
    active: isActive,
    muted: isMuted,
    // Speak ownerKey to the engine so the skip-reload strict === matches
    // whatever play() previously stamped (borrow path claims ownerKey-form).
    postId: resolvedOwnerKey,
    ownerKey: resolvedOwnerKey,
  });

  const laneOwnsThisMedia = lane.snapshot.postId === resolvedOwnerKey;
  const targetReady = startPosition <= 0 || lane.snapshot.currentTime >= startPosition - 0.3;
  const showVideo = lane.snapshot.firstFrame && targetReady && (isActive || laneOwnsThisMedia);



  const lastFFRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (lastFFRef.current === lane.snapshot.firstFrame) return;
    lastFFRef.current = lane.snapshot.firstFrame;
  }, [lane.snapshot.firstFrame]);

  // Poster paint-ready signal for surfaces that gate on it.
  useEffect(() => {
    if (!posterUrl || firedRef.current) return;
    firedRef.current = true;
    const id = requestAnimationFrame(() => onFirstFrameReady?.());
    return () => cancelAnimationFrame(id);
  }, [posterUrl, onFirstFrameReady]);

  // Stage-7 PR-2: register this card's lane host in the origin registry so
  // returnBorrow() can find it and animate the borrowed <video> back into the
  // card on close. Element-identity guard in unregister protects against
  // register/unregister races.
  useEffect(() => {
    if (!resolvedOwnerKey) return;
    const host = lane.hostRef.current;
    if (!host) return;
    originHostRegistry.register(resolvedOwnerKey, host);
    return () => originHostRegistry.unregister(resolvedOwnerKey, host);
  }, [resolvedOwnerKey, lane.hostRef]);

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
            opacity: showVideo ? 0 : 1,
            transition: 'opacity 120ms linear',
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
          // Snap to opaque the moment firstFrame flips (no transition). The
          // poster sits underneath at z:0; a 120ms fade here dips the
          // composite through ~0.5×poster + ~0.5×video mid-transition, and
          // on borrow-return that reads as a brief flash of the poster/first
          // frame as the element re-attaches. Snapping keeps the handback
          // pixel-exact.
          opacity: showVideo ? 1 : 0,
          pointerEvents: 'none',
        }}
      />

      {isActive && <MuteToggle />}
    </div>
  );
};

InlineVideo.displayName = 'InlineVideo';
