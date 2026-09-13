import { describe, expect, it } from 'vitest';
import { treatmentFor } from '@/features/explore-magazine/roundTreatment';
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
    ['ace overrides under par', { holes_in_one: 1, to_par: -6 }, shape([-1]), 'ticks'],
    ['albatross shares the override', { albatrosses: 1, to_par: -3 }, shape([-3]), 'ticks'],
    ['under par is shape', { to_par: -1 }, shape([-1]), 'shape'],
    ['course record is shape', { is_course_record: true }, shape([0]), 'shape'],
    ['extreme hole is ticks', {}, shape([2]), 'ticks'],
    ['four birdies is bar', { birdies: 4 }, shape([-1, -1, -1, -1]), 'bar'],
    ['derived clean card is bar', { clean_card: null }, shape([0, -1, 0]), 'bar'],
    ['ordinary round is none', { to_par: 4 }, shape([1, 0, 1]), 'none'],
  ])('%s', (_label, facts, holes, expected) => {
    expect(treatmentFor(item(facts), holes)).toBe(expected);
  });
});