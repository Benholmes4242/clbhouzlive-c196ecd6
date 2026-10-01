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
 * Image slides: entire component becomes inert (scrubber hidden, tap-to-pause
 * skipped) — we detect this via useClubhouseStore.carouselPositions +
 * activePost.mediaItems.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { VideoEngine } from '@/video/VideoEngine';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { Z } from '@/config/zIndex';
import type { FeedPost } from '@/components/media-system/types/media';
import type { LaneId } from '@/video/lanePolicy';

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


  const [flashIcon, setFlashIcon] = useState<'play' | 'pause' | null>(null);

  const rafRef = useRef<number | null>(null);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    </>
  );
};

export default FullscreenScrubber;
