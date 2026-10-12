import { describe, expect, it } from 'vitest';
import { cumulativeSpan, goodHoleDots, treatmentFor } from '@/features/explore-magazine/roundTreatment';
import { SC_FILL_GOLD } from '@/features/courses/components/holes/_constants';
import { TOPAR_UNDER_DARK } from '@/features/tourhub/_shared/tokens';
import type { StreamItem } from '@/features/explore-magazine/streamItem';
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';

const item = (facts: StreamItem['facts']): StreamItem => ({
  id: 'r', kind: 'round', ring: null, lane: 'news', score: 0, consequence: null,
  subject: null, who: null, facts, payload: {}, seen: false,
});
const shape = (ds: number[]): HoleShape => ({
  series: [0, ...ds.reduce<number[]>((out, d) => [...out, (out.at(-1) ?? 0) + d], [])],
  coursePar: null,
  beads: [], played: ds.length, birdies: ds.filter((d) => d < 0).length,
  holes: ds.map((d, i) => ({ holeNo: i + 1, par: 4, strokes: 4 + d, sheetStrokes: 4 + d })),
});

describe('treatmentFor', () => {
  it.each([
    ['an ace draws the line', { holes_in_one: 1 }, shape([-3, 0, 0]), 'line'],
    ['an albatross draws the line', { albatrosses: 1 }, shape([-3, 0, 0]), 'line'],
    ['an eagle draws the line', { eagles: 1 }, shape([-2, 0, 0]), 'line'],
    ['five birdies draws the line', { birdies: 5 }, shape([-1, -1, -1, -1, -1]), 'line'],
    ['under par draws the line even when flat', { to_par: -1 }, shape([-1, 0, 0]), 'line'],
    ['a course record draws the line', { is_course_record: true }, shape([0, 0, 0]), 'line'],
    /* Every settled score shape now draws, regardless of movement. */
    ['median movement alone draws the line', { to_par: 10 }, shape([1, 1, 1, 1, 1, 1, 1, 1, 1, 1]), 'line'],
    ['small movement still draws the line', { to_par: 3 }, shape([1, 1, 1]), 'line'],
    ['a flat ordinary round still draws the line', { to_par: 2 }, shape([1, 0, 1]), 'line'],
    ['a disaster-only round still draws the line', { to_par: 2 }, shape([2, 0, 0]), 'line'],
    ['no hole detail draws nothing', { to_par: -4 }, null, 'none'],
  ])('%s', (_label, facts, holes, expected) => {
    expect(treatmentFor(item(facts), holes)).toBe(expected);
  });

  it('still measures cumulative movement independently of line visibility', () => {
    expect(cumulativeSpan(shape([1, 1, 1]))).toBe(3);
    expect(cumulativeSpan(shape([1, -1, 0]))).toBe(1);
    expect(cumulativeSpan(null)).toBeNull();
  });
});

describe('goodHoleDots', () => {
  it('marks only good holes, on the cumulative value after the hole', () => {
    const dots = goodHoleDots(shape([-2, -1, 1, 2, 0, 3]));
    expect(dots).toEqual([
      { i: 1, tone: SC_FILL_GOLD, r: 4.2, ring: 1.2 },
      { i: 2, tone: TOPAR_UNDER_DARK, r: 2.8, ring: 0.8 },
    ]);
  });

  it('marks an ace in gold whatever its par', () => {
    const ace: HoleShape = { ...shape([0]), holes: [{ holeNo: 1, par: 3, strokes: 1, sheetStrokes: 1 }] };
    expect(goodHoleDots(ace)).toEqual([{ i: 1, tone: SC_FILL_GOLD, r: 4.2, ring: 1.2, halo: 7.4, label: 'ACE' }]);
  });

  it('marks a birdie in a round that is well over par', () => {
    // BRIEF_ROUND_LINE_MARKS E.0 — the line is drawn for every settled round, so
    // the marks are too. A round-level verdict must never suppress a hole-level fact.
    const dots = goodHoleDots(shape([1, -1, 1, 1, 1]));
    expect(dots).toEqual([{ i: 2, tone: TOPAR_UNDER_DARK, r: 2.8, ring: 0.8 }]);
  });

  it('grades ace, eagle and birdie into tiers with exactly one ACE label', () => {
    const s: HoleShape = { ...shape([0, 0, 0]), holes: [
      { holeNo: 1, par: 3, strokes: 1, sheetStrokes: 1 },
      { holeNo: 2, par: 5, strokes: 3, sheetStrokes: 3 },
      { holeNo: 3, par: 4, strokes: 3, sheetStrokes: 3 },
    ] };
    const dots = goodHoleDots(s);
    expect(dots.filter((d) => d.label === 'ACE')).toHaveLength(1);
    expect(dots[1].halo).toBeUndefined();
    expect(dots[2].r).toBe(2.8);
  });

  it('labels only the earlier of two aces', () => {
    const s: HoleShape = { ...shape([0, 0]), holes: [
      { holeNo: 1, par: 3, strokes: 1, sheetStrokes: 1 },
      { holeNo: 2, par: 3, strokes: 1, sheetStrokes: 1 },
    ] };
    expect(goodHoleDots(s).map((d) => d.label)).toEqual(['ACE', null]);
  });

  it('provides the same good-hole dots when a featured line is already visible', () => {
    expect(goodHoleDots(shape([-2, -1, 0, 1]))).toEqual([
      { i: 1, tone: SC_FILL_GOLD, r: 4.2, ring: 1.2 },
      { i: 2, tone: TOPAR_UNDER_DARK, r: 2.8, ring: 0.8 },
    ]);
  });
});
