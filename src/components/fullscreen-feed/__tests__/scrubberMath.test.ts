import { describe, expect, it } from 'vitest';
import { formatClock, fractionFromX, ownerMatches } from '../scrubberMath';
import { showsTopProgress } from '../FullscreenTopProgress';

const post = (types: string[]) => ({ mediaItems: types.map((type, i) => ({ id: String(i), type })) }) as any;

describe('fractionFromX', () => {
  it('clamps below 0 and above 1', () => {
    expect(fractionFromX(-50, 0, 100)).toBe(0);
    expect(fractionFromX(250, 0, 100)).toBe(1);
  });
  it('maps the midpoint to 0.5', () => expect(fractionFromX(60, 10, 100)).toBe(0.5));
  it('returns 0 for zero width', () => expect(fractionFromX(60, 10, 0)).toBe(0));
});

describe('formatClock', () => {
  it.each([[0, '0:00'], [5, '0:05'], [67, '1:07'], [750, '12:30'], [3723, '1:02:03'], [59.9, '0:59'], [-3, '0:00'], [NaN, '0:00']])(
    '%s → %s', (s, out) => expect(formatClock(s)).toBe(out),
  );
});

describe('showsTopProgress', () => {
  it('is false for 0 items, 1 image and 1 video', () => {
    expect(showsTopProgress(post([]))).toBe(false);
    expect(showsTopProgress(post(['image']))).toBe(false);
    expect(showsTopProgress(post(['video']))).toBe(false);
  });
  it('is true for 2 or more', () => {
    expect(showsTopProgress(post(['image', 'video']))).toBe(true);
    expect(showsTopProgress(post(['image', 'image', 'image']))).toBe(true);
  });
});

describe('ownerMatches', () => {
  it('matches exact', () => expect(ownerMatches('p:1', 'p:1')).toBe(true));
  it('matches bare engine id to :0', () => expect(ownerMatches('p', 'p:0')).toBe(true));
  it('matches :0 engine id to bare', () => expect(ownerMatches('p:0', 'p')).toBe(true));
});
