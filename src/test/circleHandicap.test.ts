import { describe, expect, it } from 'vitest';

import { circleHandicapDisplay } from '@/features/explore-magazine/circleHandicap';
import { INDEX_DELTA } from '@/lib/tokens/indexDelta';

const base = {
  hasActiveConnection: true,
  handicapVisibility: 'public',
  egVisible: true,
  handicapIndex: 12.4,
  deltaIndex: -0.1,
};

describe('circleHandicapDisplay', () => {
  it.each([
    { ...base, hasActiveConnection: false },
    { ...base, handicapVisibility: 'private' },
    { ...base, handicapVisibility: null },
    { ...base, egVisible: false },
    { ...base, handicapIndex: null },
  ])('withholds index and delta when disclosure fails', (input) => {
    expect(circleHandicapDisplay(input)).toBeNull();
  });

  it('formats a cut as a down arrow and movement green with no sign', () => {
    expect(circleHandicapDisplay(base)).toEqual({
      index: '12.4',
      delta: { arrow: '\u2193', text: '0.1', tone: INDEX_DELTA.dark.improved },
    });
  });

  it('formats a rise as an up arrow and movement red with no sign', () => {
    expect(circleHandicapDisplay({ ...base, deltaIndex: 0.1 })?.delta).toEqual({
      arrow: '\u2191',
      text: '0.1',
      tone: INDEX_DELTA.dark.drifted,
    });
  });

  it.each([null, 0, 0.04])('omits a missing or unchanged delta while retaining the index', (deltaIndex) => {
    expect(circleHandicapDisplay({ ...base, deltaIndex })).toEqual({ index: '12.4', delta: null });
  });

  it('uses the WHS plus-handicap formatter', () => {
    expect(circleHandicapDisplay({ ...base, handicapIndex: -2.3 })?.index).toBe('+2.3');
  });
});