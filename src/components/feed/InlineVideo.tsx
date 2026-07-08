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
import {
  vperfMarkEarlyStarted,
  vperfDualActiveAdd,
  vperfCardFraction,
  vperfCardEarlyStart,
  vperfCardFirstMotion,
  vperfCardPromoted,
  vperfCardReleased,
  vperfHandoverStart,
  vperfHandoverFrame,
} from '@/perf/vperf';
import { isPerfEnabled } from '@/perf/navTiming';


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
  /**
   * Early-motion handover: the parent feed has decided this card is the next
   * incoming card in the current scroll direction AND is warm on `feed-next`.
   * When true (and !isActive) we mount+play `feed-next` into this card's
   * host so the video is ALREADY MOVING as the card scrolls in. Parent
   * clears this on promotion, direction reversal, visibility drop, or
   * fullscreen/creation-overlay open. See CardFeed.EARLY_MOTION_FRACTION.
   */
  earlyMotion?: boolean;
  /** Fires once when the poster image has painted. */
  onFirstFrameReady?: () => void;
}

export const InlineVideo: React.FC<Props> = ({
  item,
  isActive,
  postId,
  ownerKey,
  feedIndex,
  objectFit = 'cover',
  earlyMotion = false,
  onFirstFrameReady,
}) => {
  const posterUrl =
    (item as any).thumbnailUrl ||
    (item as any).imageUrl ||
    '';
  const hlsUrl = (item as any).hlsUrl as string | undefined;
  const firedRef = useRef(false);
  const posterElRef = useRef<HTMLImageElement | null>(null);
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

  // ── Early-motion handover ──────────────────────────────────────────
  // The parent feed hands us `earlyMotion` when this card is the next
  // incoming card in the scroll direction AND `feed-next` is already warm
  // for its media. Mount+play `feed-next` into our host so the incoming
  // card is ALREADY MOVING as it enters. On promotion the outer
  // useVideoLane('feed-active') binding takes over (existing lane rotation
  // runs untouched); cleanup pauses and returns feed-next to the hidden
  // host so we never leave two <video>s stacked in the same host.
  //
  // Warm-only: verified via VideoEngine.snapshot('feed-next').postId ===
  // raw postId (CardFeed.preload stamps raw postId, not ownerKey). Cold
  // cards do not early-start — they take the normal PLAY_IN promotion.
  useEffect(() => {
    if (!earlyMotion || isActive || !hlsUrl || !resolvedOwnerKey) return;
    const snap = VideoEngine.snapshot('feed-next');
    const warm = snap.postId != null &&
      (snap.postId === postId || snap.postId === resolvedOwnerKey) &&
      (snap.state === 'ready' || snap.state === 'playing' || snap.state === 'loading');
    if (!warm) return;
    const host = lane.hostRef.current;
    if (!host) return;
    VideoEngine.mountLane('feed-next', host);
    VideoEngine.setMuted('feed-next', true); // feed is muted — no audio conflict
    void VideoEngine.play('feed-next', { callerPostId: resolvedOwnerKey });
    vperfMarkEarlyStarted(resolvedOwnerKey);
    const startedAt = performance.now();

    // [FLOW] card.earlyStart — capture visible fraction at intent moment.
    let motionRaf = 0;
    if (isPerfEnabled()) {
      vperfCardEarlyStart(resolvedOwnerKey, {
        idx: feedIndex ?? -1,
        postId: postId ?? null,
        fraction: vperfCardFraction(host),
      });
      // Poll feed-next currentTime for first advance → card.playing (moving-
      // before-1/3 verdict source). rAF is cheap; effect cleanup cancels.
      const ct0 = VideoEngine.snapshot('feed-next').currentTime || 0;
      const tick = () => {
        try {
          const s = VideoEngine.snapshot('feed-next');
          if ((s.currentTime || 0) > ct0 + 0.001) {
            vperfCardFirstMotion(resolvedOwnerKey, {
              fraction: vperfCardFraction(host),
              source: 'feed-next',
            });
            return;
          }
        } catch { /* ignore */ }
        motionRaf = requestAnimationFrame(tick);
      };
      motionRaf = requestAnimationFrame(tick);
    }

    return () => {
      if (motionRaf) cancelAnimationFrame(motionRaf);
      // [FLOW] handover probe — arm BEFORE unmount so tUnmount stamps at the
      // exact moment feed-next leaves the host. Reads feed-next currentTime
      // now so posJumpMs measures playhead continuity across the swap.
      if (isPerfEnabled()) {
        const feedNextCT = VideoEngine.snapshot('feed-next').currentTime || 0;
        vperfHandoverStart(resolvedOwnerKey, {
          idx: feedIndex ?? -1,
          hostEl: host,
          posterEl: posterElRef.current,
          feedNextCurrentTime: feedNextCT,
        });
      }
      // Even if pauseAll (fullscreen / creation overlay / visibility) has
      // already paused the lane, unmount is what removes the <video> from
      // this host so the incoming feed-active mount doesn't stack on top.
      VideoEngine.pause('feed-next', { callerPostId: resolvedOwnerKey });
      VideoEngine.unmountLane('feed-next');
      vperfDualActiveAdd(performance.now() - startedAt);
    };
  }, [earlyMotion, isActive, hlsUrl, postId, resolvedOwnerKey, feedIndex, lane.hostRef]);

  // [FLOW] card.promoted / card.released + card.playing + handover.frame ─
  // Tracks the promoted card's lifecycle on `feed-active`. All entry points
  // strict no-op when DBG off (each vperf helper checks isPerfEnabled).
  const promotedRef = useRef(false);
  const firstMotionRef = useRef(false);
  useEffect(() => {
    if (!resolvedOwnerKey || !hlsUrl) return;
    if (isActive && !promotedRef.current) {
      promotedRef.current = true;
      firstMotionRef.current = false;
      const host = lane.hostRef.current;
      vperfCardPromoted(resolvedOwnerKey, {
        idx: feedIndex ?? -1,
        fraction: vperfCardFraction(host),
      });
    }
    if (!isActive && promotedRef.current) {
      promotedRef.current = false;
      firstMotionRef.current = false;
      const host = lane.hostRef.current;
      vperfCardReleased(resolvedOwnerKey, { fraction: vperfCardFraction(host) });
    }
  }, [isActive, resolvedOwnerKey, hlsUrl, feedIndex, lane.hostRef]);

  // First painted frame on feed-active while promoted → close both the
  // card.playing arm and the handover probe with real playhead + fraction.
  useEffect(() => {
    if (!isActive || !resolvedOwnerKey || firstMotionRef.current) return;
    const ct = lane.snapshot.currentTime;
    if (!lane.snapshot.firstFrame && !(ct > 0)) return;
    firstMotionRef.current = true;
    const host = lane.hostRef.current;
    vperfCardFirstMotion(resolvedOwnerKey, {
      fraction: vperfCardFraction(host),
      source: 'feed-active',
    });
    vperfHandoverFrame(resolvedOwnerKey, { feedActiveCurrentTime: ct || 0 });
  }, [isActive, resolvedOwnerKey, lane.snapshot.firstFrame, lane.snapshot.currentTime, lane.hostRef]);



  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: '#0a0a0a' }}>
      {posterUrl && (
        <img
          ref={posterElRef}
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
