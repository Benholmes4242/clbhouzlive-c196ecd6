// frameCropMath - shared geometry for the Adjust sheet, stage/tray previews,
// and the upload-time bake. The single source of truth so the preview matches
// the posted image pixel-for-pixel.
//
// Model:
//   pos = { x, y } - each 0..100, "how far along" the excess source area the
//         crop's top-left sits. 50 = centered. This maps 1:1 to the historical
//         center-cover behaviour when pos={50,50} and scale=1.
//   scale >= 1 - multiplier over the base cover fit; 1.0 = cover, 3.0 = 3x zoom.

import type { FrameId } from '../hooks/useStageComposer';

export const MIN_SCALE = 1;
export const MAX_SCALE = 3;
export const DEFAULT_POS = { x: 50, y: 50 } as const;

export function frameRatio(frame: FrameId, srcRatio: number): number {
  if (frame === '4:5') return 4 / 5;
  if (frame === '1:1') return 1;
  if (frame === '9:16') return 9 / 16;
  return srcRatio;
}

/** Base cover-fit crop rectangle in source pixels (scale=1, centered). */
export function baseCoverCrop(iw: number, ih: number, target: number) {
  const srcRatio = iw / ih;
  let w: number, h: number;
  if (srcRatio > target) {
    h = ih;
    w = h * target;
  } else {
    w = iw;
    h = w / target;
  }
  return { w, h };
}

/** Full crop rect in source pixels for a given pos + scale. */
export function computeCropRect(
  iw: number,
  ih: number,
  frame: FrameId,
  pos: { x: number; y: number } = DEFAULT_POS,
  scale: number = 1,
) {
  const target = frameRatio(frame, iw / ih);
  const base = baseCoverCrop(iw, ih, target);
  const s = clampScale(scale);
  const cropW = base.w / s;
  const cropH = base.h / s;
  const excessX = iw - cropW;
  const excessY = ih - cropH;
  const sx = Math.max(0, Math.min(excessX, (pos.x / 100) * excessX));
  const sy = Math.max(0, Math.min(excessY, (pos.y / 100) * excessY));
  return { sx, sy, cropW, cropH, target };
}

export function clampScale(s: number) {
  if (!Number.isFinite(s)) return 1;
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));
}

export function clampPos(p: { x: number; y: number }) {
  return {
    x: Math.max(0, Math.min(100, p.x)),
    y: Math.max(0, Math.min(100, p.y)),
  };
}

/**
 * Compute CSS to render a cropped preview inside a container of (fW, fH).
 * The container itself should already be the target aspect ratio; this
 * returns how the underlying <img> should be sized and offset so its visible
 * window matches the baked crop exactly.
 */
export function computePreviewStyle(
  iw: number,
  ih: number,
  frame: FrameId,
  fW: number,
  fH: number,
  pos: { x: number; y: number } = DEFAULT_POS,
  scale: number = 1,
) {
  const rect = computeCropRect(iw, ih, frame, pos, scale);
  const pxPerSrc = fW / rect.cropW; // == fH / rect.cropH by construction
  return {
    width: iw * pxPerSrc,
    height: ih * pxPerSrc,
    left: -rect.sx * pxPerSrc,
    top: -rect.sy * pxPerSrc,
  };
}
