/**
 * useRailLane — thin React binding for the RailLanePool.
 *
 * Rents a rail lane while `active` is true, mounts its <video> element into
 * `hostRef`, loads the source muted+looped, and plays. On deactivation or
 * eviction the source is released and the host clears back to the poster
 * below.
 */

import { useEffect, useRef, useState } from 'react';
import { VideoEngine, type LaneId } from './VideoEngine';
import { RailLanePool } from './railLanePool';

export interface UseRailLaneOptions {
  /** Stable per-tile key (typically `${postId}:${mediaIndex}`). */
  ownerKey: string | null | undefined;
  /** Autoplay slot won for this tile in its rail. */
  active: boolean;
  hlsUrl: string | null | undefined;
  posterUrl?: string | null;
  postId?: string | null;
}

export interface UseRailLaneResult {
  hostRef: React.RefObject<HTMLDivElement>;
  /** Which lane (if any) is currently rented for this owner. null = show poster. */
  laneId: LaneId | null;
  /** True once the rented lane has enough data to paint (readyState >= 2). */
  ready: boolean;
}


export function useRailLane(opts: UseRailLaneOptions): UseRailLaneResult {
  const hostRef = useRef<HTMLDivElement>(null);
  const [laneId, setLaneId] = useState<LaneId | null>(null);
  const [ready, setReady] = useState(false);

  const eligible = !!(opts.active && opts.hlsUrl && opts.ownerKey);

  // Acquire / release lane based on active state.
  useEffect(() => {
    if (!eligible) return;
    const key = opts.ownerKey as string;
    const lane = RailLanePool.acquire(key);
    setLaneId(lane);
    setReady(false);
    const unsub = RailLanePool.subscribe(key, (l) => {
      setLaneId(l);
      if (l == null) setReady(false);
    });
    return () => {
      unsub();
      RailLanePool.release(key);
      setLaneId(null);
      setReady(false);
    };
  }, [eligible, opts.ownerKey]);

  // Mount + load + play the rented lane. Rails are ALWAYS muted.
  useEffect(() => {
    if (!laneId || !opts.hlsUrl) return;
    const host = hostRef.current;
    if (!host) return;
    const caller = opts.ownerKey ?? opts.postId ?? null;
    VideoEngine.mountLane(laneId, host);
    VideoEngine.setMuted(laneId, true);
    VideoEngine.load(laneId, {
      hlsUrl: opts.hlsUrl,
      posterUrl: opts.posterUrl ?? null,
      startPosition: -1,
      postId: opts.postId ?? null,
    });
    void VideoEngine.play(laneId, { callerPostId: caller });
    return () => {
      // Local deactivation — the pool.release effect above will fire the
      // engine release and unmount cleanup; here we just stop playback.
      VideoEngine.pause(laneId, { callerPostId: caller });
    };
  }, [laneId, opts.hlsUrl, opts.posterUrl, opts.postId, opts.ownerKey]);

  // Subscribe to lane snapshot to reflect ready state → poster crossfade.
  useEffect(() => {
    if (!laneId) return;
    return VideoEngine.subscribe(laneId, (snap) => {
      setReady(snap.readyState >= 2 && snap.state === 'playing');
    });
  }, [laneId]);

  return { hostRef, laneId, ready };
}

