import { describe, it, expect } from 'vitest';
import {
  courseHandicap,
  grossFromDifferential,
  buildCourseProjection,
  medianOf,
  axisScale,
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
});
