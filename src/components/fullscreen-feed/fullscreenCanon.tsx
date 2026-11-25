/**
 * Canonical fullscreen viewer pieces shared by ImmersiveFullscreenChrome and
 * CourseGalleryChrome: glass, shade, gutters, the back circle and the video
 * row (mute + inset scrubber with time). One owner, so the two chromes cannot
 * drift apart.
 */
import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { Z } from '@/config/zIndex';
import { COMMENT_BAR_H } from '@/lib/media/fullscreenBand';
import type { FeedPost } from '@/components/media-system/types/media';
import type { VideoChapter } from '@/features/post-v2/lib/videoDetails';
import { FullscreenVideoScrubber } from './FullscreenVideoScrubber';

// 16 is a FLOOR, not a fixed offset: on home-indicator phones the pill sits above the indicator.
export const COMMENT_BAR_BOTTOM = 'max(16px, env(safe-area-inset-bottom, 0px))';
// The scrubber's 32px hit area, centred on the band's top edge.
export const SCRUBBER_H = 32;
// Glass shared by the back circle, score strip and pills (signed-off mock).
export const FS_GLASS: React.CSSProperties = {
  background: 'rgba(22,22,26,0.42)',
  backdropFilter: 'blur(18px) saturate(150%)',
  WebkitBackdropFilter: 'blur(18px) saturate(150%)',
  border: '1px solid rgba(255,255,255,0.12)',
};
export const FS_SHADE_BG = 'linear-gradient(0deg, rgba(6,6,8,0.92) 0%, rgba(6,6,8,0.78) 30%, rgba(6,6,8,0.35) 62%, rgba(6,6,8,0) 100%)';
export const GUTTER_L = 'max(16px, env(safe-area-inset-left, 0px))';
export const GUTTER_R = 'max(16px, env(safe-area-inset-right, 0px))';
// The video row (28px) sits 10px above the pill row.
export const VIDEO_ROW_BOTTOM = `calc(${COMMENT_BAR_BOTTOM} + ${COMMENT_BAR_H}px + 10px)`;
// FOLLOW-UP RULINGS §3(1)/(7): the mock's 14px gaps. The scrubber's visible row
// (12px time / 11px thumb) sits 14px above the pill row; the stat row sits 14px
// above it. A post or Media run containing ANY video reserves that row on every
// slide (empty on photos), so the stack never moves; one with no video has none.
export const FS_STACK_GAP = 14;
export const FS_SCRUB_VISUAL_H = 12;
export const SCRUBBER_ROW_BOTTOM = `calc(${COMMENT_BAR_BOTTOM} + ${COMMENT_BAR_H + FS_STACK_GAP + FS_SCRUB_VISUAL_H / 2 - SCRUBBER_H / 2}px)`;
export function fullscreenStackBottom(reserveScrubber: boolean): string {
  return `calc(${COMMENT_BAR_BOTTOM} + ${COMMENT_BAR_H + FS_STACK_GAP + (reserveScrubber ? FS_SCRUB_VISUAL_H + FS_STACK_GAP : 0)}px)`;
}
// The canonical top bar's padding-top (below the notch).
export const TOP_BAR_OFFSET = 'calc(max(env(safe-area-inset-top, 0px), 48px) + 8px)';

export const BACK_HIT: React.CSSProperties = {
  width: 44, height: 44, borderRadius: '50%', background: 'transparent',
  border: 'none', display: 'inline-flex', alignItems: 'center',
  justifyContent: 'center', color: '#fff', cursor: 'pointer',
  pointerEvents: 'auto', padding: 0, flexShrink: 0,
};
export const BackCircle: React.FC = () => (
  <span data-fullscreen-back-circle style={{ ...FS_GLASS, width: 40, height: 40, borderRadius: '50%', boxSizing: 'border-box', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
    <ChevronLeft size={18} stroke="#fff" strokeWidth={2.4} style={{ display: 'block' }} />
  </span>
);

/** Video row: the scrubber (fixed, inset) spans the full gutter with its time.
 * Brief 21 F1: the viewer's one mute lives top right (FullscreenTopMute). */
export const FullscreenVideoRow: React.FC<{
  activePost: FeedPost | null;
  chapters?: VideoChapter[];
  onDraggingChange: (dragging: boolean) => void;
}> = ({ activePost, chapters, onDraggingChange }) => (
  <FullscreenVideoScrubber
    activePost={activePost}
    chapters={chapters}
    bottom={SCRUBBER_ROW_BOTTOM}
    left={GUTTER_L}
    right={GUTTER_R}
    showTime
    onDraggingChange={onDraggingChange}
  />
);
