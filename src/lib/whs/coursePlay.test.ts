import { describe, it, expect } from 'vitest';
import {
  courseHandicap,
  grossFromDifferential,
  buildCourseProjection,
  medianOf,
  axisScale,
  differentialFromGross,
  indexFromDifferentials,
  indexWithCandidate,
} from './coursePlay';

const inputs = { index: 12.4, cr: 72.1, slope: 131, par: 71 };

describe('coursePlay', () => {
  it('courseHandicap for index 12.4, CR 72.1, slope 131, par 71 is 15', () => {
    expect(courseHandicap(inputs)).toBe(15);
  });

  it('grossFromDifferential(16.8, 72.1, 131) rounds to 92', () => {
    expect(Math.round(grossFromDifferential(16.8, 72.1, 131))).toBe(92);
  });

  it('buildCourseProjection is null at 7 differentials and a value at 8', () => {
    const seven = [10, 12, 14, 16, 18, 20, 22];
    expect(buildCourseProjection(seven, inputs)).toBeNull();
    const eight = buildCourseProjection([...seven, 24], inputs);
    expect(eight).not.toBeNull();
    expect(eight!.sampleSize).toBe(8);
  });

  it('medianOf an even-length array is the mean of the middle two', () => {
    expect(medianOf([4, 1, 3, 2])).toBe(2.5);
  });

  it('axisScale(85, 97, 91) gives lo 82 and hi 100', () => {
    const s = axisScale(85, 97, 91);
    expect(s.lo).toBe(82);
    expect(s.hi).toBe(100);
  });

  it('differentialFromGross round-trips against grossFromDifferential', () => {
    const g = grossFromDifferential(16.8, 72.1, 131);
    expect(differentialFromGross(g, 72.1, 131)).toBeCloseTo(16.8, 10);
    expect(differentialFromGross(92, 72.1, 131)).toBeCloseTo(((92 - 72.1) * 113) / 131, 10);
  });

  it('indexFromDifferentials is null at 7 values and the mean of the lowest 8 at 8', () => {
    expect(indexFromDifferentials([1, 2, 3, 4, 5, 6, 7])).toBeNull();
    expect(indexFromDifferentials([8, 1, 7, 2, 6, 3, 5, 4])).toBe(4.5);
  });

  it('indexFromDifferentials ignores the 9th-worst entirely', () => {
    expect(indexFromDifferentials([1, 2, 3, 4, 5, 6, 7, 8, 99])).toBe(4.5);
    expect(indexFromDifferentials([1, 2, 3, 4, 5, 6, 7, 8, 9])).toBe(4.5);
  });

  // Oldest first: the 30 drops off; current best eight are 1..8 (index 4.5).
  const window20 = [30, 1, 2, 3, 4, 5, 6, 7, 8, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20];

  it('indexWithCandidate lowers the index for a candidate better than the 8th-best', () => {
    expect(indexWithCandidate(window20, 0)).toBe(3.5);
  });

  it('indexWithCandidate does not lower the index for a candidate worse than the 8th-best', () => {
    expect(indexWithCandidate(window20, 9)).toBe(4.5);
  });

  it('a monotonically worse candidate never produces a falling index', () => {
    let prev = -Infinity;
    for (let c = -5; c <= 40; c += 0.1) {
      const idx = indexWithCandidate(window20, c)!;
      expect(idx).toBeGreaterThanOrEqual(prev - 1e-12);
      prev = idx;
    }
  });
});
