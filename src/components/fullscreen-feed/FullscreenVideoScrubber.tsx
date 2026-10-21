/**
 * FullscreenVideoScrubber — draggable video position bar just above the
 * comment bar (signed-off mock A). Owns the viewer's ONE playback rAF poll,
 * which writes --fs-progress on the track root with zero React commits per
 * frame. Seeking uses VideoEngine.seek/play/pause/snapshot only.
 *
 * data-fs-scrubber makes FullscreenScrubber's tap-to-pause skip this bar;
 * pointer events are captured and stopped so neither pager swipes from it.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { VideoEngine } from '@/video/VideoEngine';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { Z } from '@/config/zIndex';
import type { FeedPost } from '@/components/media-system/types/media';
import type { LaneId } from '@/video/lanePolicy';
import { expectedOwnerKey, formatClock, fractionFromX, ownerMatches } from './scrubberMath';

const FILLED = 'rgba(255,255,255,0.95)';
const EMPTY = 'rgba(255,255,255,0.22)';

function clampSlide(activePost: FeedPost | null | undefined, activeSlide: number | null | undefined): number {
  const n = activePost?.mediaItems?.length ?? 0;
  return n > 0 ? Math.max(0, Math.min(activeSlide ?? 0, n - 1)) : 0;
}

/** True exactly when the scrubber renders: the active slide is a video. */
export function showsVideoScrubber(activePost: FeedPost | null | undefined, activeSlide: number | null | undefined): boolean {
  const items = activePost?.mediaItems ?? [];
  if (items.length === 0) return false;
  return (items[clampSlide(activePost, activeSlide)] as any)?.type === 'video';
}

interface Props {
  activePost: FeedPost | null;
  bottom: string;
  onDraggingChange: (dragging: boolean) => void;
}

export const FullscreenVideoScrubber: React.FC<Props> = ({ activePost, bottom, onDraggingChange }) => {
  const activePagerIdx = useFullscreenFeedStore((s) => s.activePagerIdx);
  const borrow = useFullscreenFeedStore((s) => s.borrow);
  const activeSlide = clampSlide(activePost, activePagerIdx);
  const isVideo = showsVideoScrubber(activePost, activePagerIdx);
  const expectedKey = expectedOwnerKey(activePost?.id, activeSlide);

  const laneId: LaneId = useMemo(() => {
    if (borrow && activePost && borrow.postId === activePost.id) return borrow.laneId;
    return 'fullscreen' as LaneId;
  }, [borrow, activePost?.id]);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const wasPlayingRef = useRef(false);
  const fractionRef = useRef(0);
  const seekRafRef = useRef<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [duration, setDuration] = useState(0);
  const [nowSec, setNowSec] = useState(0);
  const onDragRef = useRef(onDraggingChange);
  onDragRef.current = onDraggingChange;

  const writeProgress = (v: number) => {
    rootRef.current?.style.setProperty('--fs-progress', String(v));
  };

  // THE ONE playback rAF poll — only while a video slide is active.
  useEffect(() => {
    writeProgress(0);
    setDuration(0);
    setNowSec(0);
    if (!isVideo || !expectedKey) return;
    let alive = true;
    let last = -1;
    let lastDur = -1;
    let lastSec = -1;
    let raf: number | null = null;
    const tick = () => {
      if (!alive) return;
      try {
        const s = VideoEngine.snapshot(laneId);
        if (ownerMatches(s.postId, expectedKey)) {
          const d = s.duration > 0 ? s.duration : 0;
          if (d !== lastDur) { lastDur = d; setDuration(d); }
          if (!draggingRef.current) {
            const r = d > 0 ? Math.max(0, Math.min(1, s.currentTime / d)) : 0;
            if (r !== last) { last = r; writeProgress(r); }
            // Whole-second aria value: commits at most once per second.
            const sec = Math.floor(s.currentTime || 0);
            if (sec !== lastSec) { lastSec = sec; setNowSec(sec); }
          }
        }
      } catch { /* noop */ }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isVideo, expectedKey, laneId]);

  const ownerOk = useCallback(() => {
    if (!expectedKey) return false;
    try { return ownerMatches(VideoEngine.snapshot(laneId).postId, expectedKey); } catch { return false; }
  }, [expectedKey, laneId]);

  const seekTo = useCallback((fraction: number) => {
    if (!ownerOk() || !(duration > 0)) return;
    try { VideoEngine.seek(laneId, fraction * duration); } catch { /* noop */ }
  }, [ownerOk, duration, laneId]);

  const applyFraction = useCallback((f: number) => {
    fractionRef.current = f;
    writeProgress(f);
    setNowSec(Math.floor(f * duration));
  }, [duration]);

  const endDrag = useCallback((resume: boolean) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    if (seekRafRef.current) { cancelAnimationFrame(seekRafRef.current); seekRafRef.current = null; }
    setDragging(false);
    onDragRef.current(false);
    if (resume && wasPlayingRef.current && ownerOk()) {
      try { void VideoEngine.play(laneId, { callerPostId: expectedKey, viaViewer: true }); } catch { /* noop */ }
    }
    wasPlayingRef.current = false;
  }, [ownerOk, laneId, expectedKey]);

  // Post or slide changes mid-drag: end cleanly, no resume.
  useEffect(() => () => endDrag(false), [expectedKey, endDrag]);

  const fractionOf = (clientX: number) => {
    const r = trackRef.current?.getBoundingClientRect();
    return r ? fractionFromX(clientX, r.left, r.width) : 0;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
    if (!(duration > 0) || !ownerOk()) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* noop */ }
    let playing = false;
    try { playing = VideoEngine.snapshot(laneId).state === 'playing'; } catch { /* noop */ }
    wasPlayingRef.current = playing;
    if (playing) {
      try { VideoEngine.pause(laneId, { callerPostId: expectedKey, viaViewer: true }); } catch { /* noop */ }
    }
    draggingRef.current = true;
    setDragging(true);
    onDragRef.current(true);
    const f = fractionOf(e.clientX);
    applyFraction(f);
    seekTo(f);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    e.stopPropagation();
    applyFraction(fractionOf(e.clientX));
    if (seekRafRef.current == null) {
      seekRafRef.current = requestAnimationFrame(() => {
        seekRafRef.current = null;
        if (draggingRef.current) seekTo(fractionRef.current);
      });
    }
  };

  const onPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return;
    e.stopPropagation();
    seekTo(fractionRef.current);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
    endDrag(true);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (!(duration > 0) || !ownerOk()) return;
    e.preventDefault();
    e.stopPropagation();
    let cur = 0;
    try { cur = VideoEngine.snapshot(laneId).currentTime || 0; } catch { /* noop */ }
    const next = Math.max(0, Math.min(duration, cur + (e.key === 'ArrowRight' ? 5 : -5)));
    try { VideoEngine.seek(laneId, next); } catch { /* noop */ }
  };

  if (!isVideo) return null;

  const total = duration > 0 ? duration : 0;
  const dragSeconds = fractionRef.current * total;

  return (
    <>
      <div
        ref={rootRef}
        data-fs-scrubber
        role="slider"
        aria-label="Video position"
        aria-valuemin={0}
        aria-valuemax={Math.floor(total)}
        aria-valuenow={total > 0 ? Math.min(nowSec, Math.floor(total)) : 0}
        aria-valuetext={`${formatClock(total > 0 ? nowSec : 0)} of ${formatClock(total)}`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        style={{
          position: 'fixed', left: 0, right: 0, bottom, height: 32,
          display: 'flex', alignItems: 'center',
          pointerEvents: 'auto', touchAction: 'none',
          zIndex: Z.echo,
        }}
      >
        <div
          ref={trackRef}
          style={{
            width: '100%', height: dragging ? 4 : 2, borderRadius: 0,
            background: EMPTY, position: 'relative',
            transition: 'height 120ms ease',
          }}
        >
          <div
            style={{
              height: '100%', borderRadius: 0, background: FILLED,
              width: total > 0 ? 'calc(var(--fs-progress, 0) * 100%)' : 0,
            }}
          />
          {dragging && (
            <div
              style={{
                position: 'absolute', top: '50%', left: 'calc(var(--fs-progress, 0) * 100%)',
                width: 14, height: 14, margin: '-7px 0 0 -7px', borderRadius: '50%',
                background: '#FFFFFF', boxShadow: '0 1px 6px rgba(0,0,0,0.5)',
              }}
            />
          )}
        </div>
      </div>
      {dragging && (
        <div
          aria-hidden
          style={{
            position: 'fixed', left: 0, right: 0, bottom: `calc(${bottom} + 56px)`,
            textAlign: 'center', pointerEvents: 'none', zIndex: Z.echo,
            fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1,
            fontVariantNumeric: 'tabular-nums', color: '#FFFFFF',
          }}
        >
          {formatClock(dragSeconds)}{' '}
          <span style={{ color: 'rgba(248,250,252,0.55)' }}>/ {formatClock(total)}</span>
        </div>
      )}
    </>
  );
};

export default FullscreenVideoScrubber;
