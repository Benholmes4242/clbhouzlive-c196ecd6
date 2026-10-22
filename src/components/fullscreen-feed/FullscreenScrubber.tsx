/**
 * FullscreenScrubber — tap-to-pause + centre play/pause flash for the
 * fullscreen video viewer. The bottom progress bar and seeking are gone:
 * position/progress now live in FullscreenTopProgress (which owns the only
 * rAF poll). Playback control routes through VideoEngine, owner-guarded.
 *
 * Tap-to-pause: window-level pointer listeners record clean-tap movement so
 * the layer does NOT interfere with vertical swipe (post nav), horizontal
 * swipe (pager) or pinch (images). Only fires on a clean tap (<10px move,
 * <300ms, single finger) whose target is not the chrome or scrubber itself.
 *
 * Image slides: no toggle, no hold, no flash — but CB49's double-tap like
 * is handled HERE for images too (same window listeners).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { VideoEngine } from '@/video/VideoEngine';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { Z } from '@/config/zIndex';
import type { FeedPost } from '@/components/media-system/types/media';
import type { LaneId } from '@/video/lanePolicy';
import { expectedOwnerKey, ownerMatches } from './scrubberMath';
import { createTapHandler } from '@/components/feed/mediaTap';
import { HeartBurst } from '@/components/feed/HeartBurst';

/** Clean-gesture limits shared by tap and hold (unchanged from tap-to-pause). */
const HOLD_MS = 300;
const MOVE_PX = 10;

interface Props {
  activePost: FeedPost | null;
  activeIndex: number;
  /** CB49: double-tap like. Caller must like-only (never unlike). */
  onDoubleTapLike?: (post: FeedPost) => void;
}

export const FullscreenScrubber: React.FC<Props> = ({ activePost, onDoubleTapLike }) => {
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


  const [flashIcon, setFlashIcon] = useState<'play' | 'pause' | null>(null);
  const [burstKey, setBurstKey] = useState(0);
  const [burstVisible, setBurstVisible] = useState(false);
  const hideBurst = useCallback(() => setBurstVisible(false), []);

  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Latest like callback/post without re-binding the window listeners.
  const likeRef = useRef<{ fn?: (p: FeedPost) => void; post: FeedPost | null }>({ post: null });
  likeRef.current = { fn: onDoubleTapLike, post: activePost };

  // Gestures: window listeners filter clean single-finger presses that miss
  // the chrome / scrubber / buttons. CB49:
  //  - clean taps go through mediaTap's createTapHandler (DOUBLE_TAP_WINDOW_MS):
  //    single = play/pause toggle (video only) AFTER the window; double = like
  //    only (never unlike) + HeartBurst, with no playback change. Images get
  //    the double-tap here too (the toggle side is a no-op on them).
  //  - press-and-hold (video only): HOLD_MS still within MOVE_PX pauses via
  //    the engine (viaViewer, owner-guarded) WITHOUT pausedOwnerKeys; release
  //    restores the pre-hold state, and that pointer-up is never a tap.
  useEffect(() => {
    if (!expectedKey) return;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let armed = false;
    let moved = false;
    let pointerCount = 0;
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    // Hold lifecycle: 'fired' once the hold elapsed (whether or not it paused);
    // wasPlaying records the pre-hold state for release.
    let holdFired = false;
    let holdWasPlaying = false;

    const flash = (icon: 'play' | 'pause') => {
      setFlashIcon(icon);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => setFlashIcon(null), 400);
    };

    const toggle = () => {
      if (!isVideo) return;
      // viaViewer bypasses the borrow-swallow guard in VideoEngine so
      // tap-pause works while playback is still on the borrowed rail lane.
      try {
        const s = VideoEngine.snapshot(laneId);
        if (!ownerMatches(s.postId, expectedKey)) return;
        if (s.state === 'playing') {
          VideoEngine.pause(laneId, { callerPostId: expectedKey, viaViewer: true });
          addPausedOwnerKey(expectedKey);
          flash('pause');
        } else {
          removePausedOwnerKey(expectedKey);
          void VideoEngine.play(laneId, { callerPostId: expectedKey, viaViewer: true });
          flash('play');
        }
      } catch { /* noop */ }
    };

    const like = () => {
      setBurstKey((k) => k + 1);
      setBurstVisible(true);
      const { fn, post } = likeRef.current;
      if (fn && post) fn(post);
    };

    const tap = createTapHandler({ onSingle: toggle, onDouble: like });

    const clearHoldTimer = () => {
      if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    };
    const endHold = () => {
      clearHoldTimer();
      if (!holdFired) return;
      holdFired = false;
      if (!holdWasPlaying) return;
      holdWasPlaying = false;
      try {
        const s = VideoEngine.snapshot(laneId);
        if (!ownerMatches(s.postId, expectedKey)) return;
        void VideoEngine.play(laneId, { callerPostId: expectedKey, viaViewer: true });
      } catch { /* noop */ }
    };

    const onDown = (e: PointerEvent) => {
      pointerCount++;
      if (pointerCount > 1) { armed = false; clearHoldTimer(); return; }
      // Skip presses that start on the chrome or scrubber.
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
      if (isVideo) {
        clearHoldTimer();
        holdTimer = setTimeout(() => {
          holdTimer = null;
          if (!armed || moved || pointerCount !== 1) return;
          holdFired = true;
          holdWasPlaying = false;
          try {
            const s = VideoEngine.snapshot(laneId);
            if (!ownerMatches(s.postId, expectedKey)) return;
            if (s.state === 'playing') {
              holdWasPlaying = true;
              // Temporary: deliberately NOT addPausedOwnerKey.
              VideoEngine.pause(laneId, { callerPostId: expectedKey, viaViewer: true });
            }
          } catch { /* noop */ }
        }, HOLD_MS);
      }
    };
    const onMove = (e: PointerEvent) => {
      if (!armed) return;
      const dx = Math.abs(e.clientX - startX);
      const dy = Math.abs(e.clientY - startY);
      if (dx > MOVE_PX || dy > MOVE_PX) { moved = true; clearHoldTimer(); }
    };
    const onUp = (e: PointerEvent) => {
      pointerCount = Math.max(0, pointerCount - 1);
      clearHoldTimer();
      if (holdFired) {
        // A hold's pointer-up is never a tap; restore once all fingers lift.
        armed = false;
        if (pointerCount === 0) endHold();
        return;
      }
      if (!armed) return;
      armed = false;
      const dt = performance.now() - startT;
      if (moved || dt > HOLD_MS) return;
      tap(e as unknown as React.MouseEvent);
    };
    const onCancel = () => {
      armed = false;
      pointerCount = 0;
      endHold();
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
      clearHoldTimer();
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current = null;
      }
    };
  }, [isVideo, expectedKey, laneId, addPausedOwnerKey, removePausedOwnerKey]);

  return (
    <>
      {burstVisible && (
        <div
          data-fs-heart-burst
          aria-hidden
          style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: Z.echo + 4 }}
        >
          <HeartBurst key={burstKey} onDone={hideBurst} />
        </div>
      )}
      {/* Centre flash icon */}
      {isVideo && flashIcon && (
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
    </>
  );
};

export default FullscreenScrubber;
