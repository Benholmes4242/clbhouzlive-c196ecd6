/** Incomplete actions scroll the real page owner and focus only the first missing bar. */
import { scrollElementIntoView } from '@/lib/getScrollParent';
import { missingScores } from './scoreStepRules';
import type { ReviewComposerState } from '../types';

export function focusMissingScore(state: Pick<ReviewComposerState, 'overall' | 'scores'>,
  overall: HTMLElement | null, categories: HTMLElement | null) {
  const missing = missingScores(state);
  const host = missing.overall ? overall : categories?.querySelector(`[data-score-category="${missing.categories[0]}"]`);
  const bar = host?.querySelector<HTMLElement>('[role="slider"]');
  if (!bar) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  scrollElementIntoView(bar, { offset: 100, behavior: reduced ? 'auto' : 'smooth' });
  bar.focus({ preventScroll: true });
}