/**
 * FullscreenTopProgress — full-width segmented strip at the top of the
 * fullscreen viewer carrying BOTH carousel position and video progress.
 * Replaces the bottom carousel dots and the bottom scrubber bar.
 *
 * Not draggable, does not seek. Owns the one rAF position poll (moved
 * verbatim from FullscreenScrubber), which runs only while a video slide is
 * active. Reads activePagerIdx from useFullscreenFeedStore — never
 * clubhouseStore.carouselPositions (that lags and caused the k>0 dead-tap bug).
 *
 * Render rules by mediaCount: 0 → null; 1 image → null; 1 video → one
 * segment filling with playback; 2–10 → equal segments; >10 → a single
 * track filled to (activeSlide + slideProgress) / mediaCount.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { VideoEngine } from '@/video/VideoEngine';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { Z } from '@/config/zIndex';
import type { FeedPost } from '@/components/media-system/types/media';
import type { LaneId } from '@/video/lanePolicy';

const FILLED = 'rgba(255,255,255,0.95)';
const EMPTY = 'rgba(255,255,255,0.26)';
const MAX_SEGMENTS = 10;

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

/** True exactly when FullscreenTopProgress renders something. */
export function showsTopProgress(activePost: FeedPost | null | undefined): boolean {
  const items = activePost?.mediaItems ?? [];
  if (items.length === 0) return false;
  if (items.length === 1) return (items[0] as any)?.type === 'video';
  return true;
}

interface Props {
  activePost: FeedPost | null;
}

export const FullscreenTopProgress: React.FC<Props> = ({ activePost }) => {
  const activePagerIdx = useFullscreenFeedStore((s) => s.activePagerIdx);
  const borrow = useFullscreenFeedStore((s) => s.borrow);

  const mediaCount = activePost?.mediaItems?.length ?? 0;
  const activeSlide = mediaCount > 0
    ? Math.max(0, Math.min(activePagerIdx ?? 0, mediaCount - 1))
    : 0;
  const activeMedia = activePost?.mediaItems?.[activeSlide];
  const isVideo = !!(activeMedia && (activeMedia as any).type === 'video');
  const expectedKey = expectedOwnerKey(activePost?.id, activeSlide);

  // Lane-aware: while borrow is live for this post the media is still on the
  // borrowed rail lane; otherwise it's on 'fullscreen'.
  const laneId: LaneId = useMemo(() => {
    if (borrow && activePost && borrow.postId === activePost.id) return borrow.laneId;
    return 'fullscreen' as LaneId;
  }, [borrow, activePost?.id]);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const rafRef = useRef<number | null>(null);

  // The ONE rAF poll — only while a video slide is active.
  useEffect(() => {
    if (!isVideo || !expectedKey) return;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      try {
        const s = VideoEngine.snapshot(laneId);
        if (ownerMatches(s.postId, expectedKey)) {
          setCurrentTime(s.currentTime);
          setDuration(s.duration);
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
  }, [isVideo, expectedKey, laneId]);

  // Reset displayed position when active media changes.
  useEffect(() => {
    setCurrentTime(0);
    setDuration(0);
  }, [expectedKey]);

  if (!showsTopProgress(activePost)) return null;

  const slideProgress = isVideo
    ? (duration > 0 ? Math.max(0, Math.min(1, currentTime / duration)) : 1)
    : 1;

  const segStyle: React.CSSProperties = {
    position: 'relative', flex: 1, height: 3, borderRadius: 99, overflow: 'hidden',
  };
  const fill = (ratio: number) => (
    <div
      style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${ratio * 100}%`, background: FILLED,
        transition: 'width 100ms linear',
      }}
    />
  );

  let content: React.ReactNode;
  if (mediaCount > MAX_SEGMENTS) {
    content = (
      <div style={{ ...segStyle, background: EMPTY }}>
        {fill((activeSlide + slideProgress) / mediaCount)}
      </div>
    );
  } else {
    content = Array.from({ length: mediaCount }, (_, i) => {
      if (i < activeSlide) return <div key={i} style={{ ...segStyle, background: FILLED }} />;
      if (i > activeSlide) return <div key={i} style={{ ...segStyle, background: EMPTY }} />;
      return <div key={i} style={{ ...segStyle, background: EMPTY }}>{fill(slideProgress)}</div>;
    });
  }

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        left: 10, right: 10,
        top: 'calc(max(env(safe-area-inset-top, 0px), 44px) + 4px)',
        display: 'flex', gap: 4, height: 3,
        zIndex: Z.echo + 2,
        pointerEvents: 'none',
      }}
    >
      {content}
    </div>
  );
};

export default FullscreenTopProgress;
