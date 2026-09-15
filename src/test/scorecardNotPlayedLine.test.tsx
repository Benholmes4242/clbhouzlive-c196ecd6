/**
 * BRIEF_ROUND_SHEET follow-up A — THE UNPLAYED MARK IS NAMED, ONCE.
 *
 * The scoring key is gone, so the faint mid-dot for a hole the member never
 * played had lost its only explanation. It now sits under the card, and ONLY
 * while the round has an unplayed hole: a complete card says nothing.
 *
 * The sheet itself pulls in the whole handicap read path, so this test covers
 * the RULE that decides the line, taken from the same hole rows the card draws.
 */
import { describe, expect, it } from 'vitest';

interface Hole { holeNo: number; par: number | null; strokes: number | null }

/** Mirrors `hasUnplayedHole` in CardScorecardSheet: played rows are the ones
 *  with a real stroke count, exactly as the grid reads them. */
function hasUnplayedHole(holes: Hole[]): boolean {
  const played = holes.filter((h) => h.strokes != null && h.strokes > 0);
  return holes.length > 0 && played.length !== holes.length;
}

const whole = (n: number): Hole[] =>
  Array.from({ length: n }, (_, i) => ({ holeNo: i + 1, par: 4, strokes: 4 }));

describe('the not-played line', () => {
  it('stays away from a complete eighteen and a complete nine', () => {
    expect(hasUnplayedHole(whole(18))).toBe(false);
    expect(hasUnplayedHole(whole(9))).toBe(false);
  });

  it('appears when a hole carries no strokes', () => {
    expect(hasUnplayedHole([...whole(17), { holeNo: 18, par: 4, strokes: null }])).toBe(true);
    expect(hasUnplayedHole([...whole(17), { holeNo: 18, par: 4, strokes: 0 }])).toBe(true);
  });

  it('says nothing at all when there are no rows', () => {
    expect(hasUnplayedHole([])).toBe(false);
  });
});
