/**
 * InlineVideo — feed video shell wired via role-based lane binding (PR-B).
 *
 * Role model (see src/video/feedLaneRoles.ts):
 *   • Three PHYSICAL feed lanes ('feed-active', 'feed-next', 'feed-prev')
 *     never change. Each lane's <video> + hls instance is bound for life.
 *   • Three ROLES ('active', 'next', 'prev') point at physical lanes. On
 *     promotion the parent feed rotates roles — the physical lane the
 *     early card was playing on IS the new 'active' lane. No load, no
 *     seek, no attach fires at promotion — the SAME element keeps playing.
 *
 * This component picks its role each render:
 *   • isActive   → role = 'active'
 *   • earlyMotion (parent-driven, scroll-direction gated) → role = 'next'
 *     (down-scroll) or 'prev' (up-scroll)
 *   • otherwise  → role = null (inert, no engine interaction)
 *
 * useVideoLane resolves the physical laneId from the role and takes care
 * of mount / load / play / pause with proper cleanup semantics — a role
 * change whose resolved physical lane is unchanged fires zero engine work.
 */
import React, { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { MediaItem } from '@/components/media-system/types/media';
import { useVideoLane } from '@/video/useVideoLane';
import { VideoEngine, type LaneId, type LaneSnapshot } from '@/video/VideoEngine';
import { feedLaneRoles, type FeedRole } from '@/video/feedLaneRoles';
import { originHostRegistry } from '@/video/originHostRegistry';
import { useClubhouseStore } from '@/store/clubhouseStore';
import { MuteButton } from '@/audio/MuteButton';
import { VideoProcessingCard } from './VideoProcessingCard';
import {
  vperfMarkEarlyStarted,
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
  postId?: string | null;
  ownerKey?: string | null;
  /**
   * Early-motion signal from the parent feed. When true and !isActive, the
   * card mounts + plays the DIRECTIONAL early lane (role='next' down /
   * role='prev' up), detected by inspecting which role's physical lane is
   * currently warmed for this card's media (parent's warm effect stamps
   * postId on preload before the visibility gate flips earlyMotion true).
   */
  earlyMotion?: boolean;
  onFirstFrameReady?: () => void;
}

/** Subscribe to feedLaneRoles map for reactive laneForRole lookups. */
function useLaneForRole(role: FeedRole | null): LaneId | null {
  const laneId = useSyncExternalStore(
    (cb) => feedLaneRoles.subscribe(cb),
    () => (role ? feedLaneRoles.laneForRole(role) : null),
    () => (role ? feedLaneRoles.laneForRole(role) : null),
  );
  return laneId;
}

export const InlineVideo: React.FC<Props> = ({
  item,
  isActive,
  isNear = false,
  postId,
  ownerKey,
  feedIndex,
  objectFit = 'cover',
  earlyMotion = false,
  onFirstFrameReady,
}) => {

  const isProcessing = (item as any).isProcessing === true;
  const posterUrl = isProcessing
    ? ''
    : ((item as any).thumbnailUrl || (item as any).imageUrl || '');
  const rawHlsUrl = (item as any).hlsUrl as string | undefined;
  // While processing: no HLS load, no lane registration, no playback intent.
  const hlsUrl = isProcessing ? undefined : rawHlsUrl;
  const firedRef = useRef(false);
  const posterElRef = useRef<HTMLImageElement | null>(null);
  // Mute state now owned by VideoEngine via 'session' audioPolicy — no local read.

  const resolvedOwnerKey = ownerKey ?? (postId ? `${postId}:0` : null);

  // Role selection — single source of truth. Priority:
  //   active > early(next/prev, playing) > bound(neighbour, PAUSED)
  //
  // The "bound" tier is what keeps the real paused frame visible for
  // playingIdx±1 neighbours after they lose active/early. Any of the 3
  // feed roles whose currently-bound physical lane carries THIS card's
  // postId counts — that means the element is already parented in our
  // host with firstFrame painted, paused at its true lastPos by the
  // play-effect cleanup. We hold the role for mount-intent only; hlsUrl
  // and playback stay off so no load/seek/play fires.
  const detectRoleForMatch = (): FeedRole | null => {
    if (!resolvedOwnerKey) return null;
    // OwnerKey-normalized compare (bare `X` ≡ `X:0`, `X:1` distinct). Drops
    // the legacy `s.postId === postId` arm which could accidentally satisfy
    // a slide-0 lookup against a lane written for slide 1 once carousel
    // neighbour warms start writing `${postId}:${i}` shapes.
    const norm = (k: string | null): string | null =>
      k == null ? null : (k.includes(':') ? k : `${k}:0`);
    const target = norm(resolvedOwnerKey);
    const matches = (s: LaneSnapshot) =>
      s.postId != null && norm(s.postId) === target;
    try {
      for (const r of ['next', 'prev', 'active'] as FeedRole[]) {
        const lane = feedLaneRoles.laneForRole(r);
        if (matches(VideoEngine.snapshot(lane))) return r;
      }
    } catch { /* engine not booted */ }
    return null;
  };
  // Early role — restricted to next/prev, since 'active' during earlyMotion
  // would collide with a real active card.
  const detectEarlyRole = (): FeedRole | null => {
    const r = detectRoleForMatch();
    return r === 'next' || r === 'prev' ? r : null;
  };
  const role: FeedRole | null = isProcessing
    ? null
    : (isActive
        ? 'active'
        : (earlyMotion
            ? detectEarlyRole()
            : (isNear ? detectRoleForMatch() : null)));

  const laneId = useLaneForRole(role);
  // Playback intent — separate from role/mount. Only active or early-motion
  // cards actually load + play; neighbour "bound" roles stay paused.
  const playbackIntent = !isProcessing && (isActive || (earlyMotion && role !== null));

  // Start position: for the KEPT-BOUND promotion path (physical lane already
  // parented to this card and holding the true paused frame), skip the seed
  // entirely — passing -1 makes VideoEngine.load's alreadyLoaded branch a
  // true no-op (no seek), and the element resumes from wherever the decoder
  // actually is. Only cold mounts (lane not yet bound to this ownerKey) read
  // getLastPos, which is now written synchronously by pause()/pauseAll()/
  // useVideoLane unbind cleanup so it reflects the true scroll-out position.
  const laneAlreadyOwnsThisMedia =
    !!laneId &&
    VideoEngine.snapshot(laneId).postId === resolvedOwnerKey;
  const startPosition = React.useMemo(() => {
    if (!isActive || !resolvedOwnerKey) return -1;
    if (laneAlreadyOwnsThisMedia) return -1; // kept-bound: no seek
    const t = VideoEngine.getLastPos(resolvedOwnerKey);
    return t > 0 ? t : -1;
  }, [isActive, resolvedOwnerKey, laneAlreadyOwnsThisMedia]);

  const lane = useVideoLane(laneId, {
    hlsUrl: playbackIntent ? hlsUrl ?? null : null,
    posterUrl: posterUrl || null,
    startPosition,
    active: playbackIntent,
    audioPolicy: 'session',
    postId: resolvedOwnerKey,

    ownerKey: resolvedOwnerKey,
  });

  const snap = lane.snapshot;
  const laneOwnsThisMedia = !!snap && snap.postId === resolvedOwnerKey;
  const targetReady =
    startPosition <= 0 || (!!snap && snap.currentTime >= startPosition - 0.3);

  // KEPT-BOUND NEIGHBOUR PAUSE (explicit): when this card holds a bound role
  // but no playback intent (playingIdx±1 kept-bound), affirm the lane is
  // paused — wantPlay=false + element paused. VideoEngine.pause() is
  // idempotent, owner-guarded (rejects if we no longer own the lane), and
  // does NOT seek or reset firstFrame, so the real paused decoder frame is
  // preserved. Prevents any wantPlay residue from auto-resuming a neighbour.
  useEffect(() => {
    if (!laneId || !resolvedOwnerKey) return;
    if (playbackIntent) return;
    if (!laneOwnsThisMedia) return;
    VideoEngine.pause(laneId, { callerPostId: resolvedOwnerKey });
  }, [laneId, resolvedOwnerKey, playbackIntent, laneOwnsThisMedia]);

  // Show video when: our currently-bound physical lane has painted a frame
  // (either the promoted 'active' lane or the early 'next'/'prev' lane).
  const showVideo =
    !!snap &&
    snap.firstFrame === true &&
    laneOwnsThisMedia &&
    (isActive ? targetReady : true);


  // Register this card's lane host in the origin registry for borrow-return
  // FLIP. Uses the CURRENTLY bound physical lane so the borrow-return path
  // can re-mount whichever physical lane the tap borrowed from.
  useEffect(() => {
    if (!resolvedOwnerKey) return;
    const host = lane.hostRef.current;
    if (!host) return;
    originHostRegistry.register(resolvedOwnerKey, host);
    return () => originHostRegistry.unregister(resolvedOwnerKey, host);
  }, [resolvedOwnerKey, lane.hostRef]);

  // [FLOW] card.earlyStart instrumentation — fires once per early-motion arm.
  const earlyLoggedRef = useRef(false);
  useEffect(() => {
    if (!earlyMotion || isActive || !resolvedOwnerKey || !laneId) {
      earlyLoggedRef.current = false;
      return;
    }
    if (earlyLoggedRef.current) return;
    earlyLoggedRef.current = true;
    vperfMarkEarlyStarted(resolvedOwnerKey);
    if (!isPerfEnabled()) return;
    const host = lane.hostRef.current;
    vperfCardEarlyStart(resolvedOwnerKey, {
      idx: feedIndex ?? -1,
      postId: postId ?? null,
      fraction: vperfCardFraction(host),
    });
  }, [earlyMotion, isActive, laneId, resolvedOwnerKey, postId, feedIndex, lane.hostRef]);

  // [FLOW] card.promoted / card.released — track lifecycle on the 'active'
  // role. In the seamless-promotion case laneId is unchanged across the
  // early→active transition, so no engine work fires — only the probe.
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
      // [FLOW] handover — with role rotation, promotion is a no-op on the
      // element. Capture the current playhead so the handover probe reads
      // gapMs ≈ 0 and posJumpMs ≈ 0 (same element — nothing to jump).
      if (isPerfEnabled()) {
        const ct = laneId ? VideoEngine.snapshot(laneId).currentTime || 0 : 0;
        vperfHandoverStart(resolvedOwnerKey, {
          idx: feedIndex ?? -1,
          hostEl: host,
          posterEl: posterElRef.current,
          feedNextCurrentTime: ct,
        });
      }
    }
    if (!isActive && promotedRef.current) {
      promotedRef.current = false;
      firstMotionRef.current = false;
      const host = lane.hostRef.current;
      vperfCardReleased(resolvedOwnerKey, { fraction: vperfCardFraction(host) });
    }
  }, [isActive, resolvedOwnerKey, hlsUrl, feedIndex, laneId, lane.hostRef]);

  // First painted frame on the active lane → close handover probe.
  useEffect(() => {
    if (!isActive || !resolvedOwnerKey || firstMotionRef.current || !snap) return;
    const ct = snap.currentTime;
    if (!snap.firstFrame && !(ct > 0)) return;
    firstMotionRef.current = true;
    const host = lane.hostRef.current;
    vperfCardFirstMotion(resolvedOwnerKey, {
      fraction: vperfCardFraction(host),
      source: 'feed-active',
    });
    vperfHandoverFrame(resolvedOwnerKey, { feedActiveCurrentTime: ct || 0 });
  }, [isActive, resolvedOwnerKey, snap?.firstFrame, snap?.currentTime, lane.hostRef]);

  // Poster paint-ready signal.
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
          ref={posterElRef}
          src={posterUrl}
          alt=""
          aria-hidden
          loading="eager"
          decoding="async"
          fetchPriority={isActive || isNear ? 'high' : 'auto'}
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
      {/* Lane host — engine appendChild's the bound physical <video> here. */}
      <div
        ref={lane.hostRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: showVideo ? 1 : 0,
          pointerEvents: 'none',
        }}
      />

      {isProcessing && <VideoProcessingCard />}

      {/* ONE VIDEO CHROME (BRIEF_VIDEO_CHROME_AND_FEED_LENGTH §1): mute is a
          CONTROL and sits bottom-LEFT; duration is a LABEL and owns
          bottom-RIGHT, where every video product puts it and where the
          Discover rails already put it. Two things cannot own one corner. */}
      {isActive && !isProcessing && (
        <div style={{ position: 'absolute', left: 6, bottom: 6, zIndex: 30 }}>
          <MuteButton size="sm" />
        </div>
      )}

      {/* NO DURATION, NO CHIP — an unknown length renders nothing at all. */}
      {!isProcessing && !!item.duration && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            right: 6,
            bottom: 6,
            zIndex: 30,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 7px',
            borderRadius: 7,
            background: 'rgba(10,14,10,0.72)',
            color: '#FFFFFF',
            fontSize: 10.5,
            fontWeight: 700,
            lineHeight: 1.1,
            fontVariantNumeric: 'tabular-nums lining-nums',
            // NOT A CONTROL: it must never intercept the tap that opens the video.
            pointerEvents: 'none',
          }}
        >
          {showVideo && <PlayingBars />}
          {formatDuration(item.duration)}
        </span>
      )}
    </div>
  );
};

InlineVideo.displayName = 'InlineVideo';
