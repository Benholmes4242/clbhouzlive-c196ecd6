/**
 * The fullscreen viewer reserves this band at the bottom; media rests above
 * it, and the chrome draws the band, the comment bar inside it and the
 * scrubber on its top edge. The px and CSS forms must stay identical.
 */
export const BAND_PAD_TOP = 12;
export const COMMENT_BAR_H = 44;
export const COMMENT_BAR_FLOOR = 16;

export function bandHeightPx(safeBottom: number): number {
  return BAND_PAD_TOP + COMMENT_BAR_H + Math.max(COMMENT_BAR_FLOOR, safeBottom);
}

export const BAND_H_CSS = `calc(${BAND_PAD_TOP}px + ${COMMENT_BAR_H}px + max(${COMMENT_BAR_FLOOR}px, env(safe-area-inset-bottom, 0px)))`;