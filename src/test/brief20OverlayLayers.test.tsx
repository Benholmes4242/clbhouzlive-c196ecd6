import { afterEach, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { act, renderHook } from '@testing-library/react';
import { claimLayer, resetOverlayLayersForTests, useClaimedLayer } from '@/lib/overlayLayers';
import { COMMENTS_SHEET_Z, FS_OVERLAY_Z, LIKES_SHEET_Z, MEDIA_PREVIEW_Z, MORE_SHEET_Z, REVIEW_SHEET_Z, VIEWER_ABOVE_SHEETS_Z } from '@/lib/zLayers';
import { Z } from '@/config/zIndex';

afterEach(() => resetOverlayLayersForTests());

const FLOORS = { review: REVIEW_SHEET_Z, comments: Z.sheetBackdrop, likes: LIKES_SHEET_Z, more: MORE_SHEET_Z, scorecard: Z.sheetBackdrop };

describe('Brief 20 D — whatever opens last is on top', () => {
  for (const viewerFloor of [FS_OVERLAY_Z, VIEWER_ABOVE_SHEETS_Z]) {
    for (const [name, floor] of Object.entries(FLOORS)) {
      it(`${name} opened from a viewer at ${viewerFloor} renders above it`, () => {
        const viewer = claimLayer(viewerFloor);
        const overlay = claimLayer(floor);
        expect(overlay.z).toBeGreaterThan(viewer.z);
        overlay.release(); viewer.release();
      });
    }
  }

  it('review sheet → photo → viewer above → REVIEW pill → sheet above → close → viewer → close → sheet', () => {
    const sheet = renderHook(({ open, tick }) => useClaimedLayer(open, REVIEW_SHEET_Z, tick), { initialProps: { open: true, tick: 1 } });
    expect(sheet.result.current).toBe(REVIEW_SHEET_Z);
    const viewer = renderHook(({ open }) => useClaimedLayer(open, VIEWER_ABOVE_SHEETS_Z), { initialProps: { open: true } });
    expect(viewer.result.current).toBeGreaterThan(sheet.result.current);
    // REVIEW pill: the SAME sheet instance re-claims above the viewer.
    act(() => sheet.rerender({ open: true, tick: 2 }));
    expect(sheet.result.current).toBeGreaterThan(viewer.result.current);
    // Close the sheet → the viewer is top; close the viewer → the sheet (reopened by its tick) is top again.
    act(() => sheet.rerender({ open: false, tick: 2 }));
    expect(viewer.result.current).toBe(VIEWER_ABOVE_SHEETS_Z);
    act(() => viewer.rerender({ open: false }));
    act(() => sheet.rerender({ open: true, tick: 2 }));
    expect(sheet.result.current).toBe(REVIEW_SHEET_Z);
  });

  it('comments opened from a lifted review sheet render above it', () => {
    const viewer = claimLayer(VIEWER_ABOVE_SHEETS_Z);
    const sheet = claimLayer(REVIEW_SHEET_Z);
    const comments = claimLayer(Z.sheetBackdrop);
    expect(sheet.z).toBeGreaterThan(viewer.z);
    expect(comments.z).toBeGreaterThan(sheet.z);
    expect(claimLayer(MEDIA_PREVIEW_Z).z).toBeGreaterThan(comments.z);
    expect(COMMENTS_SHEET_Z).toBeGreaterThan(0);
  });

  it('every registered overlay claims its layer on open', () => {
    for (const file of [
      'src/components/fullscreen-feed/FullscreenFeedOverlay.tsx', 'src/components/posts/ReviewBottomSheet.tsx',
      'src/components/clubhouse/MoreOptionsDrawer.tsx', 'src/features/comments-v2/CommentsSheetV2.tsx',
      'src/components/likes/LikesSheet.tsx', 'src/features/courses/_shared/scorecard/ScorecardGlassOverlay.tsx',
      'src/components/shared/media/MediaPreviewViewer.tsx',
    ]) expect(readFileSync(file, 'utf8')).toMatch(/useClaimedLayer\(/);
  });
});
