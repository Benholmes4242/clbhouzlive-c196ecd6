/**
 * outcomeClassifier — shared any-pick-wins classifier for Intelligence picks.
 *
 * Single source of truth used by `useIntelligenceHistoricalPicks` — which
 * powers IntelligenceHero, TournamentInsights, and the All Picks sheet — so
 * outcomes never drift between surfaces.
 *
 * Semantics: outcome reflects the BEST finishing pick across rank 1-3, not
 * just the Top Pick. Matches the user-facing framing in IntelligenceHero
 * ("we called 4 winners" counts ANY pick winning, not just rank-1 picks).
 */

export type IntelligenceOutcome = 'win' | 'top5' | 'partial' | 'miss';

interface PickWithPosition {
  rank: number;
  actualPosition: number | null;
}

/**
 * Classify a tournament's outcome from its top-3 picks (any-pick-wins).
 *
 *   bestPosition === 1            → 'win'
 *   bestPosition 2-5              → 'top5'
 *   bestPosition <= 15            → 'partial'
 *   otherwise / no resolved picks → 'miss'
 */
export function classifyOutcome(picks: PickWithPosition[]): IntelligenceOutcome {
  const topThree = picks.filter((p) => p.rank >= 1 && p.rank <= 3);
  const positions = topThree
    .map((p) => p.actualPosition)
    .filter((pos): pos is number => pos !== null);

  if (positions.length === 0) return 'miss';

  const bestPosition = Math.min(...positions);
  if (bestPosition === 1) return 'win';
  if (bestPosition >= 2 && bestPosition <= 5) return 'top5';
  if (bestPosition <= 15) return 'partial';
  return 'miss';
}
