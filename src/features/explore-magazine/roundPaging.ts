/**
 * BRIEF_ROUND_SHEET §2 — SWIPE BETWEEN ROUNDS, THE DECISIONS ONLY.
 *
 * Pure so the thresholds are testable without a sheet, a finger or a DOM. The
 * host owns the animation and the analytics; this file owns WHETHER a swipe
 * pages and HOW FAR the sheet may follow a finger at either end.
 *
 * Paging exists ONLY for a sheet opened from an Explore stream card. Every
 * other consumer of the sheet never passes a sequence, so none of this runs.
 */

/** Travel that commits a page. */
export const PAGE_COMMIT_PX = 60;
/** Speed (px/ms) that commits a page regardless of travel. */
export const PAGE_FLICK = 0.5;
/** At either end the sheet follows the finger at 30% and cannot page. */
export const RUBBER = 0.3;
/** Request the next stream page once the member is this close to the end. */
export const PREFETCH_WITHIN = 2;

export type PageDirection = 'next' | 'prev';

/**
 * dx is the finger's travel: NEGATIVE is a leftward drag, which brings the NEXT
 * round in (the same direction as a photo carousel).
 */
export function pageDecision(
  index: number,
  length: number,
  dx: number,
  velocity: number,
): { direction: PageDirection; to: number } | null {
  if (length < 2) return null;
  const forward = dx < 0;
  const committed = Math.abs(dx) > PAGE_COMMIT_PX || Math.abs(velocity) > PAGE_FLICK;
  if (!committed) return null;
  const to = forward ? index + 1 : index - 1;
  if (to < 0 || to >= length) return null;
  return { direction: forward ? 'next' : 'prev', to };
}

/** How far the sheet may move for a given finger travel. Full travel in the
 *  middle of the sequence; 30% of it when there is nothing to page to. */
export function rubberBand(index: number, length: number, dx: number): number {
  const atStart = index <= 0 && dx > 0;
  const atEnd = index >= length - 1 && dx < 0;
  return atStart || atEnd ? dx * RUBBER : dx;
}

/**
 * BRIEF_ROUND_SHEET_PEEK §1 — WHICH NEIGHBOUR THE FINGER IS BRINGING IN.
 *
 * ONE neighbour, in the drag's direction only: a leftward drag (negative dx)
 * brings the NEXT round in from the right, a rightward drag brings the PREVIOUS
 * one in from the left. At either end there is nothing to bring in, so this
 * returns null and the sheet keeps the 30% resistance with nothing beside it.
 */
export function dragNeighbour(
  index: number,
  length: number,
  dx: number,
): { side: PageDirection; index: number } | null {
  if (dx === 0 || length < 2) return null;
  const forward = dx < 0;
  const to = forward ? index + 1 : index - 1;
  if (to < 0 || to >= length) return null;
  return { side: forward ? 'next' : 'prev', index: to };
}

/** The neighbours worth prefetching once a page settles. */
export function neighbours(index: number, length: number): number[] {
  return [index - 1, index + 1].filter((i) => i >= 0 && i < length);
}

/** True when the stream should ask for another page. */
export function shouldExtend(index: number, length: number): boolean {
  return length - 1 - index <= PREFETCH_WITHIN;
}

/* The one-off open cue (the text line, the nudge and the three-opens counter)
   was removed by BRIEF G5. Paging itself is above and unchanged. */
