import { describe, expect, it } from 'vitest';

import { selectMoment } from '@/components/explore-tab-new/courseled/roundMoment';

const plainHoles = Array.from({ length: 18 }, (_, index) => ({
  holeNo: index + 1,
  par: 4,
  strokes: 5,
}));

describe('COURSE RECORD moment', () => {
  it('uses the upstream live fact and marks no holes', () => {
    expect(selectMoment(plainHoles, {
      gross: 70,
      beatenGross: 73,
      heldBy: 'Morgan',
    })).toMatchObject({
      kind: 'courseRecord',
      labelKey: 'courseRecord',
      figure: 70,
      figureRole: 'score',
      sentenceKey: 'courseRecord',
      markedHoles: [],
      facts: { margin: 3, beatenGross: 73, heldBy: 'Morgan' },
    });
  });

  it('uses deliberate no-name copy when the previous profile does not resolve', () => {
    expect(selectMoment(plainHoles, {
      gross: 70,
      beatenGross: 73,
      heldBy: null,
    }).sentenceKey).toBe('courseRecordUnknown');
  });

  it('does not invent first-here or equality records without an upstream fact', () => {
    expect(selectMoment(plainHoles, null).kind).toBe('plain');
  });
});