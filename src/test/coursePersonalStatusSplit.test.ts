import { describe, expect, it } from 'vitest';
import { resolveCourseTrackedState } from '@/hooks/useCoursePersonalStatus';

describe('course personal status split', () => {
  it('populates from tracked rounds without a declaration', () => {
    expect(resolveCourseTrackedState(true, 'none')).toBe('populated');
  });

  it('populates when the only tracked round may be nine holes', () => {
    expect(resolveCourseTrackedState(true, 'none')).toBe('populated');
  });

  it('keeps rated-without-rounds distinct from never played', () => {
    expect(resolveCourseTrackedState(false, 'played')).toBe('rated_without_rounds');
  });

  it('keeps shortlisted-without-rounds in the existing never-played state', () => {
    expect(resolveCourseTrackedState(false, 'want_to_play')).toBe('never_played');
  });
});