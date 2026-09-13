import { describe, expect, it } from 'vitest';
import {
  MIN_TICK_OFF_PAR,
  offParHoleCount,
  treatmentFor,
} from '@/features/explore-magazine/roundTreatment';
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
    ['quiet ace keeps the earned override', { holes_in_one: 1, to_par: -6 }, shape([-1]), 'ticks'],
    ['quiet albatross falls through without a row', { albatrosses: 1 }, shape([-3, 1, 0]), 'none'],
    ['albatross with three off-par holes is ticks', { albatrosses: 1 }, shape([-3, 1, 1]), 'ticks'],
    ['under par with travel is shape', { to_par: -3 }, shape([-1, -1, -1]), 'shape'],
    ['course record with travel is shape', { is_course_record: true }, shape([1, 1, 1]), 'shape'],
    ['flat under-par clean round falls through to bar', { to_par: -1 }, shape([-1, 0, 0]), 'bar'],
    ['flat record with only two off-par holes falls through', { is_course_record: true }, shape([2, -1, 0]), 'none'],
    ['flat record falls through to birdie bar', { is_course_record: true, birdies: 4 }, shape([-1, 0, 0]), 'bar'],
    ['single extreme hole falls through', {}, shape([0, 2, 0]), 'none'],
    ['extreme hole with three off-par holes is ticks', {}, shape([1, 2, 1]), 'ticks'],
    ['four birdies is bar', { birdies: 4 }, shape([-1, -1, -1, -1]), 'bar'],
    ['derived clean card is bar', { clean_card: null }, shape([0, -1, 0]), 'bar'],
    ['ordinary round is none', { to_par: 4 }, shape([1, 0, 1]), 'none'],
  ])('%s', (_label, facts, holes, expected) => {
    expect(treatmentFor(item(facts), holes)).toBe(expected);
  });

  it('counts every played hole away from par', () => {
    expect(MIN_TICK_OFF_PAR).toBe(3);
    expect(offParHoleCount(shape([0, -1, 0, 2, 1]))).toBe(3);
    expect(offParHoleCount(null)).toBe(0);
  });
});