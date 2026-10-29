/** Step 2 and the receipt share this categories-only average. Integer tenths
 * make the half-up boundary stable; an incomplete set has no average. */
import type { CategoryKey } from '../types';
import { SCORE_CATEGORIES } from './scoreStepRules';

export function categoryAverage(scores: Record<CategoryKey, number | null>): number | null {
  let sum = 0;
  for (const key of SCORE_CATEGORIES) {
    const value = scores[key];
    if (value == null) return null;
    sum += value;
  }
  return Math.round(Math.round(sum * 10) / 4) / 10;
}