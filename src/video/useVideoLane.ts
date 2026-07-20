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
import { VideoEngine, type LaneId, type LaneSnapshot, type LaneAudioPolicy } from './VideoEngine';
import { useCreationOverlayStore } from '@/stores/creationOverlayStore';
import { trace, traceLookup, elIdOf } from '@/perf/trace';

export interface UseVideoLaneOptions {
  hlsUrl: string | null | undefined;
  posterUrl?: string | null;
  startPosition?: number;
  active?: boolean;
  /**
   * Audio policy for this lane. Defaults to 'session' — engine mirrors the
   * session mute store onto the element automatically. Consumers no longer
   * push mute values through the hook.
   */
  audioPolicy?: LaneAudioPolicy;
  postId?: string | null;
  /**
   * Media-level ownership key (e.g. `${postId}:${mediaIndex}`). When present,
   * this — not `postId` — is used as the VideoEngine caller/owner key so the
   * owner-guard in pause() can reject stale outgoing cards. Never null for a
   * real feed card; only genuine engine-wide pauses (pauseAll / visibility /
   * release) may pass a null caller.
   */
  ownerKey?: string | null;
  /**
   * v8 activation-claim override. When true and opts.active is also true,
   * the play() call is allowed to claim the ONE_UNMUTED_LANE slot even if
   * the feedLaneRoles map hasn't yet flipped this lane to 'active'. Set
   * ONLY by feed cards that ARE the promoted card (isActive). Preload /
   * early-motion callers leave this false so v7's steal protection stays
   * intact.
   */
  claimsAudio?: boolean;
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

  // Mount the lane element into THIS card's host whenever we HOLD a lane
  // (regardless of play-intent). This is what enables the "keep bound +
  // paused" pattern for playingIdx±1 neighbours: the physical <video>
  // stays parented in the neighbour's host, showing its real paused frame
  // — no re-parenting fires because feed lane rotation is pointer-only.
  // Load/play remain gated by opts.active below.
  useEffect(() => {

    if (!laneId) return;
    // [TRACE] lane.mount — capture the initial snapshot the hook read at
    // setState() time. This is the stale-state suspect.
    {
      const initial = VideoEngine.snapshot(laneId);
      const openT = traceLookup({
        ownerKey: opts.ownerKey ?? null,
        postId: opts.postId ?? initial.postId ?? null,
      });
      trace('lane.mount', {
        openId: openT?.openId,
        laneId,
        initialSnapshotFirstFrame: initial.firstFrame,
        initialSnapshotPostId: initial.postId,
        ownerKey: opts.ownerKey ?? null,
        postId: opts.postId ?? null,
      });
    }
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
      // Role-loss / unbind: capture live currentTime → lastPos BEFORE any
      // downstream unparent or src teardown can idle the decoder. Belt-and-
      // braces with the capture already inside VideoEngine.pause(); covers
      // the case where a card drops its laneId without an accompanying pause
      // (e.g. non-active bound-only neighbour whose role goes null).
      VideoEngine.captureLastPos(laneId);
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
    {
      const openT = traceLookup({ ownerKey: opts.postId ?? opts.ownerKey ?? null });
      trace('lane.load.call', {
        openId: openT?.openId,
        laneId,
        ownerKey: opts.postId ?? null,
        hlsUrl: opts.hlsUrl,
        startPosition: opts.startPosition ?? -1,
      });
    }
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
      void VideoEngine.play(laneId, { callerPostId, claimsAudio: opts.claimsAudio === true });
    }
    return () => {
      if (opts.active) {
        VideoEngine.pause(laneId, { callerPostId });
      }
    };
  }, [laneId, opts.active, opts.ownerKey, opts.postId, opts.claimsAudio]);

  // Resume-on-creation-overlay-close. Re-issue play-intent on the currently
  // bound lane when the overlay closes.
  const creationClosedAt = useCreationOverlayStore((s) => s.creationClosedAt);
  useEffect(() => {
    if (creationClosedAt === 0) return;
    if (!laneId || !opts.active) return;
    if (typeof document !== 'undefined' && document.hidden) return;
    const callerPostId = opts.ownerKey ?? opts.postId ?? null;
    void VideoEngine.play(laneId, { callerPostId, claimsAudio: opts.claimsAudio === true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creationClosedAt]);

  // AUDIO POLICY: declare this lane's policy to the engine. Engine handles
  // mute state from the session store; consumers do NOT push mute values.
  useEffect(() => {
    if (!laneId) return;
    VideoEngine.setAudioPolicy(laneId, opts.audioPolicy ?? 'session');
  }, [laneId, opts.audioPolicy]);

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
