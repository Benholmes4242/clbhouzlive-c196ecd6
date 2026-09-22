/**
 * BRIEF_ROUND_CARD_GROSS_AND_NET S1 — ONE DEFINITION OF THE ROUND'S SCORE.
 *
 * A Clubhouse post is a social artefact: it says what someone SHOT. The header
 * used to print `gam_round_stats.gross_score`, which is the WHS ADJUSTED gross
 * (net double bogey applied), so a capped hole made the header disagree with the
 * cells, the nines and the trajectory below it. Adjusted gross belongs on the
 * handicap surfaces, where it is the figure that moves an index.
 *
 * THE RULE:
 *   - every played hole carries a gross -> the score IS the sum of the holes,
 *     and its to-par is that sum against the played par. A partial card keeps
 *     that honest figure but qualifies it with its played-hole count.
 *   - any played hole has no gross (picked up, not returned) -> THERE IS NO
 *     ACTUAL GROSS. The WHS figure is shown and LABELLED as adjusted.
 *
 * NOTHING IS COMPUTED HERE beyond a sum of stored values. A net double bogey cap
 * depends on strokes received at that hole and is NEVER derived client-side.
 *
 * The hole-sum to-par exists only when the round's DECLARED length is known. A
 * complete card is unqualified; a partial card says how many holes it is through.
 * The WHS fallback remains the adjusted gross against stored course par.
 */
import type { PostRound } from '@/hooks/feed/usePostRounds';

export interface RoundScore {
  /** The figure to print. Null when neither a hole sum nor a WHS gross exists. */
  gross: number | null;
  /** Its to-par, or null when no par is known. */
  toPar: number | null;
  /** Played-hole count when this is a provably partial card; null when complete or unknown. */
  thru: number | null;
  /**
   * 'holes' -> the actual gross, summed from the member's own cells.
   * 'whs'   -> the adjusted gross, because the round was not completed.
   */
  source: 'holes' | 'whs' | null;
  /** How many PLAYED holes carry no score. 0 whenever source is 'holes'. */
  unscoredHoles: number;
}

export function roundScore(
  round: Pick<PostRound, 'grossScore' | 'coursePar' | 'holeShape' | 'totalHoles'>,
): RoundScore {
  const holes = round.holeShape ?? [];
  const par = round.coursePar ?? null;

  let sum = 0;
  let sumPar = 0;
  let scored = 0;
  let unscored = 0;
  for (const h of holes) {
    if (h.played === false) continue;
    if (h.gross == null || h.par == null) {
      unscored += 1;
      continue;
    }
    sum += h.gross;
    sumPar += h.par;
    scored += 1;
  }

  if (scored > 0 && unscored === 0) {
    const declared = round.totalHoles ?? null;
    const hasDeclaredLength = declared != null && declared > 0;
    return {
      gross: sum,
      toPar: hasDeclaredLength && sumPar > 0 ? sum - sumPar : null,
      thru: hasDeclaredLength && scored < declared ? scored : null,
      source: 'holes',
      unscoredHoles: 0,
    };
  }

  const whs = round.grossScore ?? null;
  return {
    gross: whs,
    toPar: whs != null && par != null ? whs - par : null,
    thru: null,
    source: whs != null ? 'whs' : null,
    unscoredHoles: unscored,
  };
}

export default roundScore;
