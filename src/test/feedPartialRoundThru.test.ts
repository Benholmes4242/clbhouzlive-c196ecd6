/**
 * BRIEF_FEED_PARTIAL_ROUND_THRU — the feed keeps played-hole score arithmetic,
 * but qualifies a provably partial card using whs_scores.total_holes.
 */
import { describe, expect, it } from 'vitest';

import { roundScore } from '@/components/feed/roundGross';
import type { PostRound, PostRoundHole } from '@/hooks/feed/usePostRounds';

const holes = (count: number, playedTo = count): PostRoundHole[] =>
  Array.from({ length: count }, (_, index) => ({
    holeNo: index + 1,
    par: 4,
    gross: index + 1 <= playedTo ? (index === 9 ? 2 : 5) : null,
    lineGross: index + 1 <= playedTo ? (index === 9 ? 2 : 5) : null,
    adjGross: index + 1 <= playedTo ? (index === 9 ? 2 : 5) : null,
    played: index + 1 <= playedTo,
  }));

const round = (
  holeShape: PostRoundHole[] | null,
  totalHoles: number | null,
  overrides: Partial<Pick<PostRound, 'grossScore' | 'coursePar'>> = {},
): Pick<PostRound, 'grossScore' | 'coursePar' | 'holeShape' | 'totalHoles'> => ({
  grossScore: overrides.grossScore ?? 72,
  coursePar: overrides.coursePar ?? 72,
  holeShape,
  totalHoles,
});

describe('feed partial-round score qualifier', () => {
  it('keeps the proof round at gross 47 and +7, qualified thru 10', () => {
    expect(roundScore(round(holes(18, 10), 18))).toEqual({
      gross: 47,
      toPar: 7,
      thru: 10,
      source: 'holes',
      unscoredHoles: 0,
    });
  });

  it('leaves a complete eighteen unqualified', () => {
    expect(roundScore(round(holes(18), 18))).toMatchObject({ gross: 87, toPar: 15, thru: null, source: 'holes' });
  });

  it('treats a declared nine as complete, not thru 9', () => {
    expect(roundScore(round(holes(9), 9))).toMatchObject({ gross: 45, toPar: 9, thru: null, source: 'holes' });
  });

  it('withholds both qualifier and to-par when declared length is unavailable', () => {
    expect(roundScore(round(holes(10), null))).toMatchObject({ gross: 47, toPar: null, thru: null, source: 'holes' });
  });

  it('keeps a picked-up hole on the unchanged WHS adjusted fallback', () => {
    const pickedUp = holes(18);
    pickedUp[7] = { ...pickedUp[7], gross: null, lineGross: 5, adjGross: 5, played: true };
    expect(roundScore(round(pickedUp, 18, { grossScore: 88, coursePar: 72 }))).toEqual({
      gross: 88,
      toPar: 16,
      thru: null,
      source: 'whs',
      unscoredHoles: 1,
    });
  });
});