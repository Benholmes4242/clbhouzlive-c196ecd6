/** Step 2 owns required-score nudges and footer priority; no round/handicap reads. */
import type { CategoryKey, ReviewComposerState } from '../types';

export const SCORE_CATEGORIES: CategoryKey[] = ['design', 'condition', 'clubhouse', 'facilities'];
export const snapScore = (value: number) => Math.round(Math.max(1, Math.min(10, value)) * 10) / 10;
export const scorePercent = (value: number) => (value - 1) / 9 * 100;
export function missingScores(state: Pick<ReviewComposerState, 'overall' | 'scores'>) {
  const categories = SCORE_CATEGORIES.filter(key => state.scores[key] == null);
  return { overall: state.overall == null, categories, ready: state.overall != null && categories.length === 0 };
}
export function scoreAction(state: Pick<ReviewComposerState, 'overall' | 'scores'>, edit: boolean, submitting: boolean) {
  const missing = missingScores(state);
  if (submitting) return { key: edit ? 'saving' : 'posting', quiet: false, count: 0 };
  if (missing.overall) return { key: 'step3.setScore', quiet: true, count: 1 };
  if (missing.categories.length === 1) return { key: 'step3.oneLeft', quiet: true, count: 1, category: missing.categories[0] };
  if (missing.categories.length > 1) return { key: 'step3.nLeft', quiet: true, count: missing.categories.length };
  return { key: edit ? 'step3.save' : 'step3.post', quiet: false, count: 0 };
}
export function scoreFooter(state: Pick<ReviewComposerState, 'overall' | 'scores' | 'shareToFeed'>, threshold: string | null) {
  if (state.overall == null) return null;
  if (threshold) return { threshold };
  if (!missingScores(state).ready) return null;
  return { key: state.shareToFeed ? 'step3.postingLine' : 'step3.savingLine', score: state.overall.toFixed(1) };
}
export function scoreShareKey(mediaCount: number, hasWords: boolean) {
  if (mediaCount > 0) return hasWords ? 'shareMediaWords' : 'shareMedia';
  return hasWords ? 'shareWords' : 'shareScore';
}