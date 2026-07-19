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
import { isPerfEnabled } from '@/perf/navTiming';
import { vperfStart, vperfMark, vperfArmLane, vperfNextId } from '@/perf/vperf';

// Session-wide hasHls resolve-rate counter, flushed to console at 25-item
// intervals when the DBG pill is on. Lets us confirm gate #2 (hlsUrl null
// because stream_id missing from the RPC row) without needing per-item logs.
const hlsStats = { seen: 0, withHls: 0, lastFlush: 0 };
function trackHls(hasHls: boolean, ownerKey: string | null | undefined) {
  if (!isPerfEnabled()) return;
  hlsStats.seen += 1;
  if (hasHls) hlsStats.withHls += 1;
  if (hlsStats.seen - hlsStats.lastFlush >= 25) {
    hlsStats.lastFlush = hlsStats.seen;
    // eslint-disable-next-line no-console
    console.info('[RAIL] hasHls', {
      seen: hlsStats.seen,
      withHls: hlsStats.withHls,
      resolveRate: +(hlsStats.withHls / hlsStats.seen).toFixed(3),
      lastOwner: ownerKey ?? null,
    });
  }
}


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

  // Log hasHls resolve rate exactly once per (ownerKey, hasHls) combination.
  const trackedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!opts.ownerKey) return;
    const tag = `${opts.ownerKey}:${opts.hlsUrl ? 1 : 0}`;
    if (trackedRef.current === tag) return;
    trackedRef.current = tag;
    trackHls(!!opts.hlsUrl, opts.ownerKey);
  }, [opts.ownerKey, opts.hlsUrl]);


  // Acquire / release lane based on active state. Acquire may return null
  // when the pool is full AND every owner is pinned by a fullscreen borrow —
  // in that case we stay on the poster and let the next eligibility change
  // (typically borrow-unpin + a re-activation) retry.
  useEffect(() => {
    if (!eligible) return;
    const key = opts.ownerKey as string;
    const lane = RailLanePool.acquire(key);
    setLaneId(lane);
    setReady(false);
    if (lane == null) {
      // No acquisition happened — no owner record to release. Still subscribe
      // in case another owner unpins and we get notified via a later touch.
      return;
    }
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

    // [VPERF] S3 autoplay.start — measure lane-acquire → load → firstFrame.
    // 'warm' = the engine skipped the reload (same postId+url still loaded).
    const autoSpanId = vperfNextId(`autoplay:${caller ?? laneId}`);
    vperfStart(autoSpanId, 'autoplay.start', {
      laneId,
      ownerKey: opts.ownerKey ?? null,
      postId: opts.postId ?? null,
      surface: 'rail',
      // Budget picked below after load() based on warm-skip hint.
    });
    vperfMark(autoSpanId, 'laneAcquire');

    const willBeltMute = !VideoEngine.isBorrowed(laneId);
    import('@/perf/audioDebug').then((m) => {
      m.logAudio('resume.effectRun', {
        laneId,
        ownerKey: opts.ownerKey ?? null,
        isBorrowed: VideoEngine.isBorrowed(laneId),
        willBeltMute,
      });
      m.logAudio('resume.hostRemount', {
        laneId,
        ownerKey: opts.ownerKey ?? null,
      });
    }).catch(() => {});

    VideoEngine.mountLane(laneId, host);
    // Declare rails as always-muted; engine enforces. Belt-and-braces setMuted
    // remains for immediate effect on first paint — BUT skip when the lane
    // is currently borrowed by the fullscreen viewer. During borrow the
    // effective policy is 'session' (see VideoEngine.applyAudioPolicy borrow
    // override); a tile-side re-mute here would fight the viewer's audio.
    // Handback's clearBorrowed → applyAudioPolicy restores rail muting.
    VideoEngine.setAudioPolicy(laneId, 'always-muted');
    if (willBeltMute) {
      VideoEngine.setMuted(laneId, true);
    }
    // Resume at the engine's lastPos for this post — kept fresh by every lane
    // (feed-active/fullscreen/rail-*) via onTime. Means closing fullscreen at
    // 20s and returning to a re-acquired rail tile picks up at 20s, not 0.
    // Read via ownerKey (caller shape) so :0-form writes from InlineVideo/
    // feed borrow resolve without relying on getLastPos's bare fallback.
    const resumeKey = opts.ownerKey ?? opts.postId ?? null;
    const resumeAt = resumeKey ? VideoEngine.getLastPos(resumeKey) : 0;

    VideoEngine.load(laneId, {
      hlsUrl: opts.hlsUrl,
      posterUrl: opts.posterUrl ?? null,
      startPosition: resumeAt > 0.1 ? resumeAt : -1,
      // Use the same owner shape that play()/pause() use. If load() speaks
      // bare postId while play() stamps `${postId}:0`, a returned borrowed
      // lane misses the warm-skip equality check and reloads the same HLS
      // source — exactly the frame-0 flash seen on close back to the tile.
      postId: resumeKey,
    });
    // Warm-skip hint set by VideoEngine.load when postId+url unchanged.
    const warm = Boolean((VideoEngine as any)._lastLoadWasWarmSkip);
    import('@/perf/vperf').then((m) => {
      m.vperfMeta(autoSpanId, { warm });
      m.vperfSetBudget(autoSpanId, warm ? 120 : 600);
    }).catch(() => {});
    vperfMark(autoSpanId, 'load');
    if (warm) {
      // Warm-skip: engine did NOT reload, so 'firstFrame' will NOT re-fire.
      // Close the span on the next paint after mount+play (perceived
      // autoplay is the visible frame that's already decoded). Without this
      // the span would orphan to the 15s watchdog.
      const raf =
        typeof requestAnimationFrame === 'function'
          ? requestAnimationFrame
          : (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16);
      raf(() => {
        import('@/perf/vperf').then((m) => {
          m.vperfMark(autoSpanId, 'warmBind');
          m.vperfEnd(autoSpanId, { closedBy: 'warmBind' });
        }).catch(() => {});
      });
      vperfArmLane(laneId, { spanId: autoSpanId, endOn: 'playing', phase: 'playing' });
    } else {
      vperfArmLane(laneId, { spanId: autoSpanId, endOn: 'firstFrame', phase: 'firstFrame' });
      vperfArmLane(laneId, { spanId: autoSpanId, endOn: 'playing' });
    }

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
      setReady(snap.firstFrame === true);
    });
  }, [laneId]);

  // NOTE: rested-tile quality upshift (nudgeLevelCap dwell) was removed —
  // it produced inconsistent blur→sharp flashes on the watch surface and
  // could interfere with cold fullscreen loads reaching firstFrame cleanly.
  // Rail/grid tiles keep the capped quality from RAIL_HLS_OVERRIDES.
  // The FEED borrow-open upshift in FeedSlide is a SEPARATE call site and
  // is intentionally left untouched.

  return { hostRef, laneId, ready };
}

