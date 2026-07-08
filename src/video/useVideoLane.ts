/**
 * useVideoLane — thin React binding for VideoEngine.
 *
 * PR-B: `laneId` may now be null. When null, the hook is inert (no mount,
 * no load, no play, no pause). Consumers that want role-based rotation
 * resolve `laneId` via `feedLaneRoles.laneForRole(role)` and pass null
 * when the card holds no role.
 *
 * Effect cleanups pause the CURRENT-effect laneId (captured by closure), so
 * a role rotation that changes the resolved laneId cleanly pauses the OLD
 * physical lane before the new effect mounts the NEW physical lane. When
 * laneId is unchanged across a rotation (typical promotion path: role
 * 'next' → 'active' after rotate() ran first), the effect deps are equal
 * and NO teardown/setup fires — the same element keeps playing without a
 * load(), seek(), or attach cycle.
 */

import { useEffect, useRef, useState } from 'react';
import { VideoEngine, type LaneId, type LaneSnapshot } from './VideoEngine';
import { useCreationOverlayStore } from '@/stores/creationOverlayStore';

export interface UseVideoLaneOptions {
  hlsUrl: string | null | undefined;
  posterUrl?: string | null;
  startPosition?: number;
  active?: boolean;
  muted?: boolean;
  postId?: string | null;
  /**
   * Media-level ownership key (e.g. `${postId}:${mediaIndex}`). When present,
   * this — not `postId` — is used as the VideoEngine caller/owner key so the
   * owner-guard in pause() can reject stale outgoing cards. Never null for a
   * real feed card; only genuine engine-wide pauses (pauseAll / visibility /
   * release) may pass a null caller.
   */
  ownerKey?: string | null;
}

export interface UseVideoLaneResult {
  hostRef: React.RefObject<HTMLDivElement>;
  snapshot: LaneSnapshot | null;
  play: () => Promise<void>;
  pause: () => void;
  seek: (t: number) => void;
  setMuted: (m: boolean) => void;
  release: () => void;
}

const NULL_SNAP: LaneSnapshot = {
  laneId: 'feed-active',
  state: 'idle',
  currentTime: 0,
  readyState: 0,
  duration: 0,
  muted: true,
  firstFrame: false,
  postId: null,
};

export function useVideoLane(
  laneId: LaneId | null,
  opts: UseVideoLaneOptions
): UseVideoLaneResult {
  const hostRef = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState<LaneSnapshot | null>(() => {
    if (!laneId) return null;
    VideoEngine.boot();
    return VideoEngine.snapshot(laneId);
  });

  // Mount the lane element into THIS card's host — but only while active.
  // On laneId change or unmount, the previous lane's element stays where it
  // was parented; a rotation will re-appendChild it into the new host via
  // the new binding. No explicit unmount is issued here (elements never
  // move BETWEEN lanes; they can freely re-parent between hosts).
  useEffect(() => {
    if (!laneId) return;
    let raf = 0;
    const tryMount = () => {
      const host = hostRef.current;
      if (host) {
        VideoEngine.mountLane(laneId, host);
        return;
      }
      raf = requestAnimationFrame(tryMount);
    };
    tryMount();
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [laneId]);


  // Subscribe to lane state.
  useEffect(() => {
    if (!laneId) {
      setSnapshot(null);
      return;
    }
    return VideoEngine.subscribe(laneId, setSnapshot);
  }, [laneId]);

  // Load source — only for the active card. Same postId+url is a no-op
  // inside the engine (alreadyLoaded skip), so a role rotation that lands
  // the same postId on the same physical lane is a true no-op: no reload,
  // no seek. This is the PR-B seamless promotion guarantee.
  useEffect(() => {
    if (!laneId || !opts.active || !opts.hlsUrl) return;
    VideoEngine.load(laneId, {
      hlsUrl: opts.hlsUrl,
      posterUrl: opts.posterUrl ?? null,
      startPosition: opts.startPosition ?? -1,
      postId: opts.postId ?? null,
    });
    setSnapshot(VideoEngine.snapshot(laneId));
  }, [laneId, opts.active, opts.hlsUrl, opts.posterUrl, opts.startPosition, opts.postId]);

  // Auto play/pause with cleanup — cleanup pauses the CURRENT-effect laneId
  // (captured by closure). This is what makes role rotation safe: when the
  // ex-active card's role goes null → laneId goes null, the cleanup fires
  // for the OLD laneId (the physical lane it was bound to) and pauses it.
  useEffect(() => {
    if (!laneId) return;
    const callerPostId = opts.ownerKey ?? opts.postId ?? null;
    if (opts.active) {
      void VideoEngine.play(laneId, { callerPostId });
    }
    return () => {
      if (opts.active) {
        VideoEngine.pause(laneId, { callerPostId });
      }
    };
  }, [laneId, opts.active, opts.ownerKey, opts.postId]);

  // Resume-on-creation-overlay-close. Re-issue play-intent on the currently
  // bound lane when the overlay closes.
  const creationClosedAt = useCreationOverlayStore((s) => s.creationClosedAt);
  useEffect(() => {
    if (creationClosedAt === 0) return;
    if (!laneId || !opts.active) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    const callerPostId = opts.ownerKey ?? opts.postId ?? null;
    void VideoEngine.play(laneId, { callerPostId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creationClosedAt]);

  // Apply mute.
  useEffect(() => {
    if (!laneId) return;
    if (typeof opts.muted === 'boolean') {
      VideoEngine.setMuted(laneId, opts.muted);
    }
  }, [laneId, opts.muted]);

  return {
    hostRef,
    snapshot: snapshot ?? (laneId ? NULL_SNAP : null),
    play: () => (laneId ? VideoEngine.play(laneId) : Promise.resolve()),
    pause: () => { if (laneId) VideoEngine.pause(laneId); },
    seek: (t: number) => { if (laneId) VideoEngine.seek(laneId, t); },
    setMuted: (m: boolean) => { if (laneId) VideoEngine.setMuted(laneId, m); },
    release: () => { if (laneId) VideoEngine.release(laneId); },
  };
}
