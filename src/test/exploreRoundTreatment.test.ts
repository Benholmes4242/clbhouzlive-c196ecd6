import { describe, expect, it } from 'vitest';
import {
  MIN_SHAPE_SPAN,
  cumulativeSpan,
  dotsFor,
  treatmentFor,
} from '@/features/explore-magazine/roundTreatment';
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
  beads: [], played: ds.length, birdies: ds.filter((d) => d < 0).length,
  holes: ds.map((d, i) => ({ holeNo: i + 1, par: 4, strokes: 4 + d })),
});

describe('treatmentFor', () => {
  it.each([
    ['an ace draws the line', { holes_in_one: 1 }, shape([-3, 0, 0]), 'line'],
    ['an albatross draws the line', { albatrosses: 1 }, shape([-3, 0, 0]), 'line'],
    ['an eagle draws the line', { eagles: 1 }, shape([-2, 0, 0]), 'line'],
    ['four birdies draws the line', { birdies: 4 }, shape([-1, -1, -1, -1]), 'line'],
    ['under par draws the line even when flat', { to_par: -1 }, shape([-1, 0, 0]), 'line'],
    ['a course record draws the line', { is_course_record: true }, shape([0, 0, 0]), 'line'],
    ['movement alone draws the line', { to_par: 4 }, shape([1, 1, 1]), 'line'],
    ['a flat ordinary round draws nothing', { to_par: 2 }, shape([1, 0, 1]), 'none'],
    ['a disaster-only round draws nothing', { to_par: 2 }, shape([2, 0, 0]), 'none'],
    ['no hole detail draws nothing', { to_par: -4 }, null, 'none'],
  ])('%s', (_label, facts, holes, expected) => {
    expect(treatmentFor(item(facts), holes)).toBe(expected);
  });

  it('uses the span threshold derived from real rounds', () => {
    expect(MIN_SHAPE_SPAN).toBe(3);
    expect(cumulativeSpan(shape([1, 1, 1]))).toBe(3);
    expect(cumulativeSpan(shape([1, -1, 0]))).toBe(1);
    expect(cumulativeSpan(null)).toBeNull();
  });
});

describe('dotsFor', () => {
  it('marks only good holes, on the cumulative value after the hole', () => {
    const dots = dotsFor(item({ eagles: 1 }), shape([-2, -1, 1, 2, 0, 3]));
    expect(dots).toEqual([
      { i: 1, tone: SC_FILL_GOLD },
      { i: 2, tone: TOPAR_UNDER_DARK },
    ]);
  });

  it('marks an ace in gold whatever its par', () => {
    const ace: HoleShape = { ...shape([0]), holes: [{ holeNo: 1, par: 3, strokes: 1 }] };
    expect(dotsFor(item({ holes_in_one: 1 }), ace)).toEqual([{ i: 1, tone: SC_FILL_GOLD }]);
  });

  it('never marks a round that earned its line on movement alone', () => {
    expect(dotsFor(item({ to_par: 4 }), shape([1, -1, 1, 1, 1]))).toEqual([]);
  });
});

describe('Retired consequence admission', () => {
  it("drops another member's ordinary round at a course the viewer has played", () => {
    const sources = {
      standing: new Map([['c', { course_id: 'c', rank_now: 9, rank_then: 9, delta: 0, field_now: 18 } as never]]),
      records: { holders: new Map(), lostToViewer: new Set<string>() } as never,
      bests: new Map([['c', 74]]),
      shortlist: new Set<string>(),
    };
    const base = { courseId: 'c', userId: 'u', playDate: '2026-09-12', isSelf: false, isCircle: false, isNotable: false };
    expect(roundConsequence({ ...base, gross: 79 }, sources)).toBeNull();
    expect(roundConsequence({ ...base, gross: 68 }, sources)).toBeNull();
    expect(roundConsequence({ ...base, gross: 68, isCircle: true }, sources)?.kind).toBe('circle_round');
    expect(roundConsequence({ ...base, gross: 68, isNotable: true }, sources)?.kind).toBe('platform_notable');
  });

  it('leaves the viewer their own round with no consequence rather than a restated standing', () => {
    const sources = {
      standing: new Map([['c', { course_id: 'c', rank_now: 9, rank_then: null, delta: null, field_now: 18 } as never]]),
      records: { holders: new Map(), lostToViewer: new Set<string>() } as never,
      bests: new Map<string, number>(),
      shortlist: new Set<string>(),
    };
    expect(
      roundConsequence(
        { courseId: 'c', userId: 'v', gross: 79, playDate: '2026-09-12', isSelf: true, isCircle: false, isNotable: false },
        sources,
      ),
    ).toBeNull();
  });
});
