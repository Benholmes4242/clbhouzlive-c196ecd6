import { describe, expect, it } from 'vitest';

type Declaration = 'played' | 'want_to_play' | 'none';

function courseYouState(hasTrackedRounds: boolean, declaration: Declaration) {
  if (hasTrackedRounds) return 'populated';
  if (declaration === 'played') return 'rated_without_rounds';
  return 'never_played';
}

describe('course personal status split', () => {
  it('populates from tracked rounds without a declaration', () => {
    expect(courseYouState(true, 'none')).toBe('populated');
  });

  it('populates when the only tracked round may be nine holes', () => {
    expect(courseYouState(true, 'none')).toBe('populated');
  });

  it('keeps rated-without-rounds distinct from never played', () => {
    expect(courseYouState(false, 'played')).toBe('rated_without_rounds');
  });

  it('keeps shortlisted-without-rounds in the existing never-played state', () => {
    expect(courseYouState(false, 'want_to_play')).toBe('never_played');
  });
});