import { describe, it, expect } from 'vitest';
import { courseRankLabels } from './courseRankLabels';

describe('courseRankLabels', () => {
  it('both ranks present: world first, then region', () => {
    expect(courseRankLabels([{ list: 'gbi', rank: 14 }, { list: 'global', rank: 16 }])).toEqual(['#16 World', '#14 GB&I']);
  });
  it('world only', () => {
    expect(courseRankLabels([{ list: 'global', rank: 3 }])).toEqual(['#3 World']);
  });
  it('region only', () => {
    expect(courseRankLabels([{ list: 'europe', rank: 7 }])).toEqual(['#7 Europe']);
    expect(courseRankLabels([{ list: 'usa', rank: 9 }])).toEqual(['#9 USA']);
  });
  it('drops a rank of 101', () => {
    expect(courseRankLabels([{ list: 'global', rank: 101 }, { list: 'gbi', rank: 14 }])).toEqual(['#14 GB&I']);
  });
  it('empty in, empty out', () => {
    expect(courseRankLabels([])).toEqual([]);
  });
});
