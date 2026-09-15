/**
 * BRIEF_ROUND_SHEET_CUES §1 — WHERE MID SITS, AS ARITHMETIC.
 *
 * Extracted from BottomSheet so the rule can be tested without layout: jsdom has
 * no boxes, and the one thing worth asserting here is the rule, not the browser.
 *
 * MID = everything down to the marker's bottom edge, PLUS the peek the consumer
 * declared, capped at 62dvh and never below 160px. The peek is what makes the
 * next section show below the card, so the sheet cannot read as finished. With
 * no peek declared the old 16px breathing space stands, unchanged.
 */

export const MID_CAP_DVH = 0.62;
export const MID_MIN_PX = 160;
/** The gap kept below the marker when there is nothing to reveal. */
export const MID_PAD_PX = 16;

export interface MidInput {
  /** The sheet's full laid-out height in px. */
  sheetHeight: number;
  /** Viewport height, for the cap. */
  viewportHeight: number;
  /** Distance from the sheet's top to the marker's bottom edge, or null. */
  markerExtent: number | null;
  /** How much of the next section must show. 0 when there is nothing below. */
  peek: number;
}

export interface MidResult {
  /** The mid height in px. */
  mid: number;
  /** How far the sheet is pushed down at mid. 0 means mid IS full. */
  offset: number;
  /** True only when mid genuinely hides something — the fade's one condition. */
  peeking: boolean;
}

export function midExtent({ sheetHeight, viewportHeight, markerExtent, peek }: MidInput): MidResult {
  const cap = Math.round(viewportHeight * MID_CAP_DVH);
  const wanted = markerExtent == null
    ? cap
    : Math.min(cap, Math.max(MID_MIN_PX, Math.round(markerExtent + (peek > 0 ? peek : MID_PAD_PX))));
  const mid = Math.min(sheetHeight, wanted);
  const offset = Math.max(0, sheetHeight - mid);
  return { mid, offset, peeking: peek > 0 && offset > 2 };
}
