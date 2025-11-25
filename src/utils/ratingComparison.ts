export type RatingComparisonState =
  | { type: 'only-user' }
  | { type: 'on-par' }
  | { type: 'higher'; diff: number }
  | { type: 'lower'; diff: number };

export function getRatingComparisonState(
  totalRatings: number,
  communityAverage: number | null,
  userOverall: number | null
): RatingComparisonState | null {
  if (!userOverall || !communityAverage) return null;

  // A: Only 1 rating total → hide comparison sentence
  if (totalRatings <= 1) {
    return { type: 'only-user' };
  }

  const diff = +(userOverall - communityAverage).toFixed(1);

  // tiny epsilon to treat "same" as equal
  if (Math.abs(diff) < 0.05) {
    return { type: 'on-par' };
  }

  if (diff > 0) {
    return { type: 'higher', diff };
  }

  return { type: 'lower', diff: Math.abs(diff) };
}
