/**
 * THE ROUND POST'S VERDICT LINE AND ITS TRACE KEY — pure functions over what the
 * card already holds. No fetch happens here.
 *
 * goodHoleCounts reads holeDeltas, the same pass goodHoleDots reads, using the
 * same test (an ace or delta <= -2 is gold, delta -1 is a birdie), so the key
 * above the trace can never disagree with the dots on it.
 */
import type { HoleShape } from '@/components/explore-tab-new/courseled/hooks/useRoundHoleShapes';
import { holeDeltas } from './roundTreatment';
import { formatOrdinal } from '@/i18n/format';

export function goodHoleCounts(shape: HoleShape | null | undefined): { birdies: number; eagles: number } {
  let birdies = 0;
  let eagles = 0;
  for (const { delta, strokes } of holeDeltas(shape)) {
    if (strokes === 1 || delta <= -2) eagles += 1;
    else if (delta === -1) birdies += 1;
  }
  return { birdies, eagles };
}

export interface VerdictInput {
  /** net minus par; null when the member's handicap is unknown. */
  vsHcp: number | null;
  context: { rank_here: number | null; rounds_here: number | null; best_here: number | null } | null;
  eagles: number;
  holesInOne: number;
  cleanCard: boolean;
  /** Second person on the viewer's own post, third person otherwise. */
  self: boolean;
}

export interface VerdictClause {
  key: string;
  opts?: Record<string, unknown>;
}

/** lead is the plain clause; emphasis is the one weight-700 clause. */
export interface Verdict {
  lead: VerdictClause | null;
  emphasis: VerdictClause;
}

/** A rank is only claimed inside the member's top three rounds here: a lower
 *  rank is true but is not a claim worth making about a member's own round. */
const RANK_CLAIM_CEILING = 3;

/**
 * The round against the member's handicap first, then the strongest TRUE claim:
 * best here; a rank among their rounds here; a feat. A missing rank or count
 * drops the comparative clause entirely — it is never softened. "Best here
 * within a period" needs dated history the card does not hold, so it is not
 * offered. Returns null when there is nothing true to say.
 */
export function roundVerdict(input: VerdictInput): Verdict | null {
  const p = input.self ? 'self' : 'other';
  const hcp: VerdictClause | null = input.vsHcp == null
    ? null
    : input.vsHcp < 0
      ? { key: `hcpUnder_${p}`, opts: { count: Math.abs(input.vsHcp) } }
      : input.vsHcp > 0
        ? { key: `hcpOver_${p}`, opts: { count: input.vsHcp } }
        : { key: `hcpLevel_${p}` };

  const rank = input.context?.rank_here ?? null;
  const rounds = input.context?.rounds_here ?? null;
  let claim: VerdictClause | null = null;
  if (rank != null && rounds != null && rounds > 1) {
    if (rank === 1) claim = { key: `bestHere_${p}` };
    else if (rank <= RANK_CLAIM_CEILING) claim = { key: `rankHere_${p}`, opts: { rank: formatOrdinal(rank), count: rounds } };
  }
  if (!claim) {
    if (input.holesInOne > 0) claim = { key: 'featHoleInOne' };
    else if (input.eagles > 0) claim = { key: 'featEagle', opts: { count: input.eagles } };
    else if (input.cleanCard) claim = { key: 'featCleanCard' };
  }

  if (hcp && claim) return { lead: hcp, emphasis: claim };
  if (hcp) return { lead: null, emphasis: hcp };
  if (claim && claim.key.startsWith('feat')) return { lead: null, emphasis: { ...claim, key: `${claim.key}Alone` } };
  return null;
}

/** B.1 — a stableford round leads with points; any other round with the gross. */
export function headlineFigure(r: { stableford: number | null; gross: number | null; toPar: number | null }):
  { kind: 'points'; value: number } | { kind: 'gross'; value: number; toPar: number | null } | null {
  if (r.stableford != null) return { kind: 'points', value: r.stableford };
  if (r.gross != null) return { kind: 'gross', value: r.gross, toPar: r.toPar };
  return null;
}
