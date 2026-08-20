import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * useExploreLens — RELEVANCE lens for Around the World (BRIEF_DISCOVER_RELEVANCE).
 *
 * Replaces the geographic region scope as the ONE state owner for that section.
 * URL-backed (?lens=), replace-history so pill taps don't pollute the back stack.
 *
 * LEGACY: any deep link or stored preference still carrying ?region=gbi|usa|
 * europe|row (or the older uk-ireland / continental-europe / rest-of-world
 * slugs) resolves to WORLDWIDE rather than erroring.
 */
export type ExploreLens = 'suggested' | 'top_100' | 'played' | 'worldwide';

// Validation-only; intentionally not kept in display order (see ScopePills LENS_ORDER).
const LENSES: ExploreLens[] = ['suggested', 'top_100', 'played', 'worldwide'];

/**
 * SUGGESTED IS THE LANDING LENS (BRIEF_GOLF_THIS_WEEK §3). The old objection to
 * it — that a relevance lens can come back empty — no longer applies: on Golf
 * this week SUGGESTED ORDERS AND NEVER FILTERS, so the section holds the same
 * rounds under it as under Worldwide, in the order that spreads courses and
 * faces widest. With a median of four follows per member, the app choosing on
 * their behalf is the correct default. Still URL-backed only (?lens=).
 */
export const DEFAULT_LENS: ExploreLens = 'suggested';

export function useExploreLens() {
  const [params, setParams] = useSearchParams();

  const raw = params.get('lens');
  const legacyRegion = params.get('region');

  let lens: ExploreLens = DEFAULT_LENS;
  if (raw === 'for_you') {
    // Legacy label value: FOR YOU was renamed SUGGESTED. Map silently.
    lens = 'suggested';
  } else if (raw && LENSES.includes(raw as ExploreLens)) {
    lens = raw as ExploreLens;
  } else if (legacyRegion) {
    // Retired geography axis — never error, just show everything.
    lens = 'worldwide';
  }

  const setLens = useCallback(
    (next: ExploreLens) => {
      const newParams = new URLSearchParams(params);
      newParams.delete('region');
      if (next === DEFAULT_LENS) newParams.delete('lens');
      else newParams.set('lens', next);
      setParams(newParams, { replace: true });
    },
    [params, setParams],
  );

  return { lens, setLens };
}
