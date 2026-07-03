/**
 * useVideoLane — thin React binding for VideoEngine.
 *
 * Mounts a lane's <video> element into `hostRef`, loads the given source,
 * optionally auto-plays when `active` is true. React never owns the lane
 * element — the engine does. This hook only wires refs and reports state.
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

  // Mount lane element into hostRef.
  useEffect(() => {
    if (!hostRef.current) return;
    VideoEngine.mountLane(laneId, hostRef.current);
    return () => {
      VideoEngine.unmountLane(laneId);
    };
  }, [laneId]);

  // Subscribe to lane state.
  useEffect(() => {
    return VideoEngine.subscribe(laneId, setSnapshot);
  }, [laneId]);

  // Load source when it changes.
  useEffect(() => {
    if (!opts.hlsUrl) return;
    VideoEngine.load(laneId, {
      hlsUrl: opts.hlsUrl,
      posterUrl: opts.posterUrl ?? null,
      startPosition: opts.startPosition ?? -1,
      postId: opts.postId ?? null,
    });
  }, [laneId, opts.hlsUrl, opts.posterUrl, opts.startPosition, opts.postId]);

  // Auto play/pause based on `active`.
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
