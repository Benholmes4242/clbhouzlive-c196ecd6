/**
 * FullscreenScrubber — thin bottom progress bar + tap-to-pause for the
 * fullscreen video viewer.
 *
 * All playback control routes through VideoEngine (never raw element calls).
 * Position/duration are read from VideoEngine.snapshot('fullscreen') via a
 * rAF loop while visible. Seeks are gated by an ownerKey check against the
 * live snapshot — a seek must never land on a repointed lane.
 *
 * Tap-to-pause: window-level pointer listeners record clean-tap movement so
 * the layer does NOT interfere with vertical swipe (post nav), horizontal
 * swipe (pager) or pinch (images). Only fires on a clean tap (<10px move,
 * <300ms, single finger) whose target is not the chrome or scrubber itself.
 *
 * Image slides: entire component becomes inert (scrubber hidden, tap-to-pause
 * skipped) — we detect this via useClubhouseStore.carouselPositions +
 * activePost.mediaItems.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { VideoEngine } from '@/video/VideoEngine';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { Z } from '@/config/zIndex';
import type { FeedPost } from '@/components/media-system/types/media';
import type { LaneId } from '@/video/lanePolicy';

function fmtTime(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return '0:00';
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, '0')}`;
}

function expectedOwnerKey(postId: string | undefined, mediaIdx: number): string | null {
  if (!postId) return null;
  return postId.includes(':') ? postId : `${postId}:${mediaIdx}`;
}

// Owner-key match: engine returns either bare postId or `${postId}:${idx}`.
function ownerMatches(snapPostId: string | null | undefined, expected: string): boolean {
  if (!snapPostId) return false;
  if (snapPostId === expected) return true;
  // Legacy: engine stored bare id, expected is `${id}:0`.
  if (!snapPostId.includes(':') && expected === `${snapPostId}:0`) return true;
  // Or engine stored `${id}:0`, expected is bare.
  if (!expected.includes(':') && snapPostId === `${expected}:0`) return true;
  return false;
}

interface Props {
  activePost: FeedPost | null;
  activeIndex: number;
}

export const FullscreenScrubber: React.FC<Props> = ({ activePost }) => {
  // Pager-idx and borrow live in the fullscreen store — the ONLY sources of
  // truth for which media is currently active + which lane it's playing on.
  // clubhouseStore.carouselPositions is NOT consulted here (it lags the
  // fullscreen pager and produced the k>0 dead-tap bug).
  const activePagerIdx = useFullscreenFeedStore((s) => s.activePagerIdx);
  const borrow = useFullscreenFeedStore((s) => s.borrow);
  const addPausedOwnerKey = useFullscreenFeedStore((s) => s.addPausedOwnerKey);
  const removePausedOwnerKey = useFullscreenFeedStore((s) => s.removePausedOwnerKey);

  const activeMedia = activePost?.mediaItems?.[activePagerIdx];
  const isVideo = !!(activeMedia && (activeMedia as any).type === 'video');
  const expectedKey = expectedOwnerKey(activePost?.id, activePagerIdx);

  // Lane-aware: while borrow is live for this post the media is still on the
  // borrowed rail lane; otherwise (cold/non-borrow, post-demote, other pager
  // pages) it's on 'fullscreen'. borrow becomes null on demote/close/route.
  const laneId: LaneId = useMemo(() => {
    if (borrow && activePost && borrow.postId === activePost.id) return borrow.laneId;
    return 'fullscreen' as LaneId;
  }, [borrow, activePost?.id]);


  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [flashIcon, setFlashIcon] = useState<'play' | 'pause' | null>(null);

  const dragTimeRef = useRef<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // rAF poll — only while a video slide is active.
  useEffect(() => {
    if (!isVideo || !expectedKey) return;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      try {
        const s = VideoEngine.snapshot(laneId);
        if (ownerMatches(s.postId, expectedKey)) {
          if (!dragging) setCurrentTime(s.currentTime);
          setDuration(s.duration);
          setIsPlaying(s.state === 'playing');
        }
      } catch { /* noop */ }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      alive = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [isVideo, expectedKey, laneId, dragging]);

  // Reset displayed position when active media changes.
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
    setDragging(false);
    dragTimeRef.current = null;
  }, [expectedKey]);

  const applySeek = useCallback((sec: number) => {
    if (!expectedKey) return;
    try {
      const s = VideoEngine.snapshot(laneId);
      if (!ownerMatches(s.postId, expectedKey)) return; // stale owner — reject
      const target = Math.max(0, Math.min(sec, duration > 0 ? duration : sec));
      VideoEngine.seek(laneId, target);
    } catch { /* noop */ }
  }, [expectedKey, laneId, duration]);


  // Bar drag handlers.
  const seekFromClientX = useCallback((clientX: number): number | null => {
    const el = barRef.current;
    if (!el || duration <= 0) return null;
    const r = el.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    return ratio * duration;
  }, [duration]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!isVideo || duration <= 0) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    setDragging(true);
    const t = seekFromClientX(e.clientX);
    if (t != null) {
      dragTimeRef.current = t;
      setCurrentTime(t);
    }
  }, [isVideo, duration, seekFromClientX]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    e.stopPropagation();
    const t = seekFromClientX(e.clientX);
    if (t != null) {
      dragTimeRef.current = t;
      setCurrentTime(t);
    }
  }, [dragging, seekFromClientX]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    e.stopPropagation();
    const t = dragTimeRef.current;
    if (t != null) applySeek(t);
    setDragging(false);
    dragTimeRef.current = null;
  }, [dragging, applySeek]);

  // Tap-to-pause: window listener, filters clean single-finger taps that miss
  // the chrome / scrubber. Only active while a video slide is showing.
  useEffect(() => {
    if (!isVideo || !expectedKey) return;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let armed = false;
    let moved = false;
    let pointerCount = 0;

    const onDown = (e: PointerEvent) => {
      pointerCount++;
      if (pointerCount > 1) { armed = false; return; }
      // Skip taps that start on the chrome or scrubber.
      const path = (e.composedPath?.() ?? []) as Element[];
      const inChrome = path.some((n) => {
        if (!(n instanceof Element)) return false;
        return (
          n.hasAttribute?.('data-immersive-chrome') ||
          n.hasAttribute?.('data-fs-scrubber') ||
          n.hasAttribute?.('data-immersive-tap-skip')
        );
      });
      if (inChrome) { armed = false; return; }
      // Interactive elements (buttons, links) — skip.
      const inButton = path.some((n) =>
        n instanceof Element &&
        (n.tagName === 'BUTTON' || n.tagName === 'A' || n.hasAttribute?.('role'))
      );
      if (inButton) { armed = false; return; }
      armed = true;
      moved = false;
      startX = e.clientX;
      startY = e.clientY;
      startT = performance.now();
    };
    const onMove = (e: PointerEvent) => {
      if (!armed) return;
      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      if (dx > 10 || dy > 10) moved = true;
    };
    const onUp = (e: PointerEvent) => {
      pointerCount = Math.max(0, pointerCount - 1);
      if (!armed) return;
      armed = false;
      const dt = performance.now() - startT;
      if (moved || dt > 300) return;
      // Clean tap — toggle play/pause via engine, owner-guarded. viaViewer
      // bypasses the borrow-swallow guard in VideoEngine so tap-pause works
      // while playback is still on the borrowed rail lane.
      try {
        const s = VideoEngine.snapshot(laneId);
        if (!ownerMatches(s.postId, expectedKey)) return;
        if (s.state === 'playing') {
          VideoEngine.pause(laneId, { callerPostId: expectedKey, viaViewer: true });
          addPausedOwnerKey(expectedKey);
          setFlashIcon('pause');
        } else {
          removePausedOwnerKey(expectedKey);
          void VideoEngine.play(laneId, { callerPostId: expectedKey, viaViewer: true });
          setFlashIcon('play');
        }
        if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        flashTimerRef.current = setTimeout(() => setFlashIcon(null), 400);
      } catch { /* noop */ }

    };
    const onCancel = () => {
      armed = false;
      pointerCount = 0;
    };

    window.addEventListener('pointerdown', onDown, true);
    window.addEventListener('pointermove', onMove, true);
    window.addEventListener('pointerup', onUp, true);
    window.addEventListener('pointercancel', onCancel, true);
    return () => {
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointermove', onMove, true);
      window.removeEventListener('pointerup', onUp, true);
      window.removeEventListener('pointercancel', onCancel, true);
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current = null;
      }
    };
  }, [isVideo, expectedKey, laneId, addPausedOwnerKey, removePausedOwnerKey]);

  const progress = duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 0;
  const barHeight = dragging ? 6 : 3;
  const thumbSize = dragging ? 12 : 0;

  if (!isVideo) return null;

  return (
    <>
      {/* Centre flash icon */}
      {flashIcon && (
        <div
          aria-hidden
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 78, height: 78, borderRadius: '50%',
            background: 'rgba(0,0,0,0.42)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
            zIndex: Z.echo + 4,
            animation: 'fs-scrubber-flash 400ms ease-out forwards',
          }}
        >
          {flashIcon === 'pause' ? (
            <Pause size={38} fill="#fff" stroke="#fff" />
          ) : (
            <Play size={38} fill="#fff" stroke="#fff" />
          )}
        </div>
      )}
      <style>{`@keyframes fs-scrubber-flash { 0% { opacity: 0.95; transform: translate(-50%,-50%) scale(0.85); } 60% { opacity: 0.85; transform: translate(-50%,-50%) scale(1); } 100% { opacity: 0; transform: translate(-50%,-50%) scale(1.05); } }`}</style>

      {/* Scrubber bar — very bottom edge */}
      <div
        data-fs-scrubber
        style={{
          position: 'fixed',
          left: 0, right: 0,
          bottom: 0,
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          zIndex: Z.echo + 3,
          pointerEvents: 'none',
        }}
      >
        {/* Time bubble */}
        {dragging && duration > 0 && (
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: `${progress * 100}%`,
              transform: 'translate(-50%, -140%)',
              bottom: 'calc(env(safe-area-inset-bottom, 0px) + 14px)',
              background: 'rgba(0,0,0,0.66)',
              color: '#fff',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontSize: 11,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums lining-nums',
              padding: '3px 7px',
              borderRadius: 6,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {fmtTime(currentTime)}
          </div>
        )}
        {/* Bar hit-area (14px tall) — inner track is thinner */}
        <div
          ref={barRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            position: 'relative',
            height: 14,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'stretch',
            touchAction: 'none',
            pointerEvents: 'auto',
            cursor: 'pointer',
          }}
        >
          {/* Track */}
          <div
            style={{
              position: 'absolute',
              left: 0, right: 0, bottom: 0,
              height: barHeight,
              background: 'rgba(255,255,255,0.25)',
              transition: 'height 140ms ease',
            }}
          />
          {/* Fill */}
          <div
            style={{
              position: 'absolute',
              left: 0, bottom: 0,
              width: `${progress * 100}%`,
              height: barHeight,
              background: '#FFFFFF',
              transition: 'height 140ms ease',
            }}
          />
          {/* Thumb (only when dragging) */}
          {dragging && (
            <div
              style={{
                position: 'absolute',
                left: `${progress * 100}%`,
                bottom: barHeight / 2 - thumbSize / 2,
                width: thumbSize,
                height: thumbSize,
                borderRadius: '50%',
                background: '#fff',
                transform: 'translateX(-50%)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.45)',
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default FullscreenScrubber;
