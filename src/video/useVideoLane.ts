/**
 * useVideoLane — thin React binding for VideoEngine.
 *
 * Mounts a lane's <video> element into `hostRef` **only when the card is
 * active**, so the shared lane element FOLLOWS activation across the feed
 * (appendChild atomically moves the node from the previous host to the new
 * one). React never owns the lane element — the engine does. This hook
 * only wires refs and reports state.
 *
 * The mount / load / play effects are all keyed on `active`: exactly one
 * card at a time asks the engine to mount + load + play. Neighbours stay
 * on their posters until they take over.
 */

import { useEffect, useRef, useState } from 'react';
import { VideoEngine, type LaneId, type LaneSnapshot } from './VideoEngine';

export interface UseVideoLaneOptions {
  hlsUrl: string | null | undefined;
  posterUrl?: string | null;
  startPosition?: number;
  active?: boolean;
  muted?: boolean;
  postId?: string | null;
}

export interface UseVideoLaneResult {
  hostRef: React.RefObject<HTMLDivElement>;
  snapshot: LaneSnapshot;
  play: () => Promise<void>;
  pause: () => void;
  seek: (t: number) => void;
  setMuted: (m: boolean) => void;
  release: () => void;
}

export function useVideoLane(
  laneId: LaneId,
  opts: UseVideoLaneOptions
): UseVideoLaneResult {
  const hostRef = useRef<HTMLDivElement>(null);
  const [snapshot, setSnapshot] = useState<LaneSnapshot>(() => {
    VideoEngine.boot();
    return VideoEngine.snapshot(laneId);
  });

  // Mount the lane element into THIS card's host — but only while active.
  // When another card becomes active, its mount effect appendChild's the
  // element out of us automatically; no explicit unmount needed here.
  useEffect(() => {
    if (!opts.active || !hostRef.current) return;
    VideoEngine.mountLane(laneId, hostRef.current);
    // No cleanup: the next active card will move the element away, or
    // the fullscreen close path will call release/unmountLane as needed.
  }, [laneId, opts.active]);

  // Subscribe to lane state.
  useEffect(() => {
    return VideoEngine.subscribe(laneId, setSnapshot);
  }, [laneId]);

  // Load source — only for the active card (avoids every mounted card
  // thrashing the shared lane on scroll). Same postId+url is a no-op
  // inside the engine, so remounting the active card is cheap.
  useEffect(() => {
    if (!opts.active || !opts.hlsUrl) return;
    VideoEngine.load(laneId, {
      hlsUrl: opts.hlsUrl,
      posterUrl: opts.posterUrl ?? null,
      startPosition: opts.startPosition ?? -1,
      postId: opts.postId ?? null,
    });
  }, [laneId, opts.active, opts.hlsUrl, opts.posterUrl, opts.startPosition, opts.postId]);

  // Auto play/pause based on `active`. play() is safe to call before mount:
  // the engine queues it and consumes on the next mountLane.
  useEffect(() => {
    if (opts.active) {
      void VideoEngine.play(laneId);
    } else {
      VideoEngine.pause(laneId);
    }
  }, [laneId, opts.active]);

  // Apply mute.
  useEffect(() => {
    if (typeof opts.muted === 'boolean') {
      VideoEngine.setMuted(laneId, opts.muted);
    }
  }, [laneId, opts.muted]);

  return {
    hostRef,
    snapshot,
    play: () => VideoEngine.play(laneId),
    pause: () => VideoEngine.pause(laneId),
    seek: (t: number) => VideoEngine.seek(laneId, t),
    setMuted: (m: boolean) => VideoEngine.setMuted(laneId, m),
    release: () => VideoEngine.release(laneId),
  };
}
