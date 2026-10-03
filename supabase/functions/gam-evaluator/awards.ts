// Award resolution for gam-evaluator. Pure, so it can be unit-tested.

export type UnitCandidate = {
  unit_kind: string;
  unit_key: number;
  /** The figure being judged. Never null — a null unit is skipped, not zeroed. */
  value: number;
  lowerBetter: boolean;
  /** To-par on a hole unit, used only by the first-birdie rule. */
  holeToPar: number | null;
};

export type BestsRow = {
  user_id: string;
  golf_course_id: string;
  unit_kind: string;
  unit_key: number;
  attempts: number;
  best_value: number | null;
  second_value: number | null;
  third_value: number | null;
  tenth_value: number | null;
  best_score_id: string | null;
  best_attained_at: string | null;
  birdied: boolean;
  first_birdie_at: string | null;
};

/** Strictly better, in the unit's own direction. Equality is NOT better. */
export function unitBetter(v: number, ref: number, lowerBetter: boolean): boolean {
  return lowerBetter ? v < ref : v > ref;
}

export type ResolvedAward = {
  award_kind: string;
  tier: "gold" | "silver" | "bronze";
  previous_value: number | null;
  /** NULL means "somewhere in the top ten and not knowable from here". */
  rank_here: number | null;
};

/**
 * THE TIERS. attempts is the count BEFORE this round — this round has not been
 * folded into the bests yet, which is exactly why the fold happens afterwards.
 *
 * Gold, silver and bronze are mutually exclusive; the first-birdie bronze is a
 * SEPARATE award with its own award_kind, so an eagle on a never-birdied hole
 * can be both a hole gold and a first-birdie bronze. Those are different events
 * and must not share a sentence.
 *
 * Equalling your best is a SILVER with its own kind (matched_best) so the copy
 * can say "Matched your best here" rather than "second best here". This applies
 * to coarse units only — holes earn no placings at all (see resolveAwards).
 *
 * RANK COMES FROM THIS ROW AND NOWHERE ELSE. The tier and the rank are two
 * readings of one comparison, so they are taken from one source; derived from
 * the round history instead, they disagreed — a −3 came back as rank 1 when it
 * was not the best. The row holds four reference values, so 4th–9th is
 * genuinely unknown and the honest answer is NULL, which the UI reads as
 * "top ten". It is never estimated, interpolated, or looked up again.
 */
export function resolveAwards(u: UnitCandidate, prior: BestsRow | null): ResolvedAward[] {
  const attempts = prior?.attempts ?? 0;
  const best = prior?.best_value == null ? null : Number(prior.best_value);
  const second = prior?.second_value == null ? null : Number(prior.second_value);
  const third = prior?.third_value == null ? null : Number(prior.third_value);
  const tenth = prior?.tenth_value == null ? null : Number(prior.tenth_value);
  const out: ResolvedAward[] = [];

  /* One placing, read off the same four markers the tiers are read from. */
  const rankFromBests = (): number | null => {
    if (best != null && (unitBetter(u.value, best, u.lowerBetter) || u.value === best)) return 1;
    if (second != null && unitBetter(u.value, second, u.lowerBetter)) return 2;
    if (third != null && unitBetter(u.value, third, u.lowerBetter)) return 3;
    return null;
  };

  // HOLE UNITS EARN ONLY A BEST OR A FIRST BIRDIE. matched_best, top_three and
  // top_ten never fire on a hole: bests folded from imported history made a
  // member's first fresh round harvest hole placings in bulk, and "matched your
  // score on the 7th" is a weak claim anyway. All three placing branches are
  // skipped TOGETHER — skipping only matched_best would fall through to
  // top_three and relabel the same noise as silver. Coarse units keep all five.
  const placingsAllowed = u.unit_kind !== "hole";
  if (best != null && unitBetter(u.value, best, u.lowerBetter) && attempts >= 2) {
    out.push({ award_kind: "new_best", tier: "gold", previous_value: best, rank_here: rankFromBests() });
  } else if (!placingsAllowed) {
    // hole unit, not a new best: nothing from the ladder
  } else if (best != null && u.value === best && attempts >= 5) {
    out.push({ award_kind: "matched_best", tier: "silver", previous_value: best, rank_here: rankFromBests() });
  } else if (third != null && unitBetter(u.value, third, u.lowerBetter) && attempts >= 5) {
    out.push({ award_kind: "top_three", tier: "silver", previous_value: third, rank_here: rankFromBests() });
  } else if (tenth != null && unitBetter(u.value, tenth, u.lowerBetter) && attempts >= 10) {
    out.push({ award_kind: "top_ten", tier: "bronze", previous_value: tenth, rank_here: rankFromBests() });
  }

  // NO ATTEMPT FLOOR, AND IT NEVER GETS ONE. Without it nothing can fire before
  // a member's third visit to a course; it was the first award 18 of 22 members
  // ever earned. If scope is ever cut, this is the last thing to go.
  if (u.unit_kind === "hole" && u.holeToPar != null && u.holeToPar <= -1 && prior?.birdied !== true) {
    out.push({ award_kind: "first_birdie", tier: "bronze", previous_value: null, rank_here: rankFromBests() });
  }

  return out;
}
