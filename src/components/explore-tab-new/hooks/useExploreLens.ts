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
 * WORLDWIDE IS THE LANDING LENS (BRIEF_FEAT_BALANCE_AND_LENS_ORDER §3).
 * Suggested is relevance-led and therefore narrower; on a small member base it
 * leans toward a handful of familiar courses, and a discovery section that is
 * empty for a new member is failing at the one job it has. The lens is
 * URL-backed only (?lens=), so a member who has chosen one keeps it for as long
 * as that URL lives; there is no per-member persistence.
 */
export const DEFAULT_LENS: ExploreLens = 'worldwide';

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
