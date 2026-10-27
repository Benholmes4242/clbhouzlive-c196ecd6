import { describe, expect, it } from 'vitest';
import { A, courseSubScoreTone } from '@/features/courses/components/holes/analytical/tokens';
import { bandColor, bandColorOnDark } from '@/features/courses/_shared/scoreBands';

describe('all-white course and review ratings', () => {
  it('courseSubScoreTone makes 8.2 and 9.6 white and keeps null muted', () => {
    expect(courseSubScoreTone(8.2)).toBe(A.INK);
    expect(courseSubScoreTone(9.6)).toBe(A.INK);
    expect(courseSubScoreTone(null)).toBe(A.MUTE);
    expect(courseSubScoreTone(undefined)).toBe(A.MUTE);
  });
  it('bandColorOnDark makes 3, 6 and 9.5 white and preserves absent tones', () => {
    for (const score of [3, 6, 9.5]) {
      expect(bandColorOnDark(score)).toBe(A.INK);
      expect(bandColor(score)).toBe(A.INK);
    }
    expect(bandColorOnDark(null)).toBe('rgba(255,255,255,0.70)');
    expect(bandColor(null)).toBe('#AEB4BC');
  });
});