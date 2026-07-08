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
import { MuteToggle } from '@/components/feed/MuteToggle';
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
   * role='prev' up). Parent clears on promotion, direction reversal,
   * visibility drop, fullscreen open.
   */
  earlyMotion?: boolean;
  /** Scroll direction at earlyMotion assignment (+1 down, -1 up). Determines
   *  which role/physical-lane this card binds during early motion. */
  earlyDir?: 1 | -1 | 0;
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
  postId,
  ownerKey,
  feedIndex,
  objectFit = 'cover',
  earlyMotion = false,
  earlyDir = 0,
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

  const resolvedOwnerKey = ownerKey ?? (postId ? `${postId}:0` : null);

  // Role selection — single source of truth. Priority: active > early.
  const role: FeedRole | null = isActive
    ? 'active'
    : earlyMotion
      ? (earlyDir < 0 ? 'prev' : 'next')
      : null;

  const laneId = useLaneForRole(role);

  // Start position: read lastPos when we (re)activate the active role. The
  // PR-B seamless-promotion case (early lane already playing → becomes
  // active with the SAME physical lane) never re-fires load (deps unchanged),
  // so startPosition is only consulted on a cold active mount.
  const startPosition = React.useMemo(() => {
    if (!isActive || !resolvedOwnerKey) return -1;
    const t = VideoEngine.getLastPos(resolvedOwnerKey);
    return t > 0 ? t : -1;
  }, [isActive, resolvedOwnerKey]);

  const lane = useVideoLane(laneId, {
    hlsUrl: role ? hlsUrl ?? null : null,
    posterUrl: posterUrl || null,
    startPosition,
    active: !!role,
    muted: isMuted,
    postId: resolvedOwnerKey,
    ownerKey: resolvedOwnerKey,
  });

  const snap = lane.snapshot;
  const laneOwnsThisMedia = !!snap && snap.postId === resolvedOwnerKey;
  const targetReady =
    startPosition <= 0 || (!!snap && snap.currentTime >= startPosition - 0.3);

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

      {isActive && <MuteToggle />}
    </div>
  );
};

InlineVideo.displayName = 'InlineVideo';
