/**
 * FullscreenTopProgress — full-width segmented strip at the top of the
 * fullscreen viewer carrying CAROUSEL POSITION ONLY. Video progress and
 * seeking live in FullscreenVideoScrubber (above the comment bar), which owns
 * the one playback rAF poll.
 *
 * Not draggable, does not seek. Reads activePagerIdx from
 * useFullscreenFeedStore — never clubhouseStore.carouselPositions (that lags
 * and caused the k>0 dead-tap bug).
 *
 * Render rules by mediaCount: 0 or 1 → null; 2–10 → equal segments, filled up
 * to and including the active slide; >10 → a single track filled to
 * (activeSlide + 1) / mediaCount.
 */
import React from 'react';
import { useFullscreenFeedStore } from '@/store/fullscreenFeedStore';
import { Z } from '@/config/zIndex';
import type { FeedPost } from '@/components/media-system/types/media';

const FILLED = 'rgba(255,255,255,0.95)';
const EMPTY = 'rgba(255,255,255,0.26)';
const MAX_SEGMENTS = 10;

/** True exactly when FullscreenTopProgress renders something. */
export function showsTopProgress(activePost: FeedPost | null | undefined): boolean {
  return (activePost?.mediaItems?.length ?? 0) >= 2;
}

interface Props {
  activePost: FeedPost | null;
}

export const FullscreenTopProgress: React.FC<Props> = ({ activePost }) => {
  const activePagerIdx = useFullscreenFeedStore((s) => s.activePagerIdx);
  const mediaCount = activePost?.mediaItems?.length ?? 0;
  const activeSlide = mediaCount > 0
    ? Math.max(0, Math.min(activePagerIdx ?? 0, mediaCount - 1))
    : 0;

  if (!showsTopProgress(activePost)) return null;

  const segStyle: React.CSSProperties = {
    position: 'relative', flex: 1, height: 3, borderRadius: 99, overflow: 'hidden',
  };

  let content: React.ReactNode;
  if (mediaCount > MAX_SEGMENTS) {
    content = (
      <div style={{ ...segStyle, background: EMPTY }}>
        <div
          style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${((activeSlide + 1) / mediaCount) * 100}%`, background: FILLED,
            transition: 'width 100ms linear',
          }}
        />
      </div>
    );
  } else {
    content = Array.from({ length: mediaCount }, (_, i) => (
      <div key={i} style={{ ...segStyle, background: i <= activeSlide ? FILLED : EMPTY }} />
    ));
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
