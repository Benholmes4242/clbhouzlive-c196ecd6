/**
 * WHERE THE STROKES GO (BRIEF_HANDICAP_TAB_REBUILD phase 5).
 *
 * Pure derivations for the HolesSection rebuild. EVERY figure comes from
 * get_my_scoring_breakdown_all_courses (ParSplit rows) — none from
 * get_trophy_aggregates (§5.3: the old caption mixed the two RPCs, whose
 * populations differ by nine-hole rounds, so the arithmetic did not close).
 *
 * THE BASIS RULE (§5.2): holes a round for a par type is
 *   holes_played(type) / Σ holes_played(all three types) × 18.
 * NEVER holes_played / complete_rounds: the RPC's par splits are built from
 * every fetched round including PARTIAL cards, while complete_rounds counts
 * only rounds whose hole rows total exactly eighteen scored holes. Dividing
 * one by the other mixes populations and overstates the figure — ~2% with
 * clean data, up to half with many partial cards. The mix ratio is immune.
 * Shots a round for a type is then avg_over(type) × holes a round(type).
 */

export interface ParSplitInput {
  par: number;
  avg_over: number;
  holes_played: number;
  pct_par_better: number;
  pct_bogey: number;
  pct_double: number;
  /**
   * Exact hole counts per outcome band (5B L1), added to the RPC by hand.
   * over ≤ −1 / = 0 / = 1 / ≥ 2; the four partition holes_played exactly.
   * OPTIONAL: a client running against a database without the updated
   * function will not have them, and in that case the distribution bar
   * does not render at all (5B L3) — never approximated from the pct_*
   * fields, because pct_par_better is par-OR-better and that conflation
   * is the bug 5B fixes.
   */
  birdie_better_count?: number;
  par_count?: number;
  bogey_count?: number;
  double_count?: number;
}

/**
 * MIN_HOLES_PAR_TYPE (BRIEF_HANDICAP_TAB_REBUILD_5A H1) — a par type needs
 * this many holes before its shots-a-round figure renders. At 90 holes the
 * standard error on a per-hole average is about 0.12 shots, against a spread
 * between par types of roughly 0.1, so below that the figure cannot support
 * the comparison it is drawn to make. This is a FIGURE-LEVEL withhold, not a
 * row-level one: the row still renders its label, holes-a-round and
 * holes-played meta; only the shots-a-round figure and the bar fill are
 * withheld, and a withheld type cannot win the derived title (H2). The mix
 * ratio is NOT gated (H3): it is a proportion of holes, not an average of
 * scores, so it does not carry the same uncertainty.
 */
export const MIN_HOLES_PAR_TYPE = 90;

export interface ParTypeRow {
  parN: 3 | 4 | 5;
  holesPlayed: number;
  /** Holes of this type per 18 (§5.2 mix ratio). Never withheld (H3). */
  holesPerRound: number;
  /** avg_over, i.e. shots dropped per hole of this type. */
  perHole: number;
  /**
   * Shots dropped per round on this type: perHole × holesPerRound.
   * NULL when holesPlayed < MIN_HOLES_PAR_TYPE (H1 figure-level withhold).
   */
  shotsPerRound: number | null;
}

export interface OutcomeBands {
  /**
   * Display-rounded integer percentages summing to exactly 100 (5B L2):
   * derived from the exact counts, rounded, with any 99/101 rounding
   * difference added to the largest band so the bar fills exactly.
   */
  birdiePlus: number;
  par: number;
  bogey: number;
  doublePlus: number;
}

export interface StrokesGo {
  totalHoles: number;
  rows: ParTypeRow[];
  /** The row carrying the largest share of dropped shots (drives the title). */
  dominant: ParTypeRow | null;
  /**
   * NULL when any present par type lacks the four count fields (5B L3):
   * the bar and band labels do not render — absent, not approximated.
   */
  bands: OutcomeBands | null;
}

const TYPES: Array<{ parN: 3 | 4 | 5; key: 'par3' | 'par4' | 'par5' }> = [
  { parN: 3, key: 'par3' },
  { parN: 4, key: 'par4' },
  { parN: 5, key: 'par5' },
];

export function deriveStrokesGo(
  splits: Record<'par3' | 'par4' | 'par5', ParSplitInput | null>,
): StrokesGo | null {
  const present = TYPES.map((t) => ({ ...t, data: splits[t.key] })).filter(
    (t): t is typeof t & { data: ParSplitInput } => !!t.data && t.data.holes_played > 0,
  );
  if (present.length === 0) return null;

  const totalHoles = present.reduce((s, t) => s + t.data.holes_played, 0);
  if (totalHoles <= 0) return null;

  const rows: ParTypeRow[] = present.map((t) => {
    const holesPerRound = (t.data.holes_played / totalHoles) * 18;
    return {
      parN: t.parN,
      holesPlayed: t.data.holes_played,
      holesPerRound,
      perHole: t.data.avg_over,
      shotsPerRound:
        t.data.holes_played >= MIN_HOLES_PAR_TYPE
          ? t.data.avg_over * holesPerRound
          : null,
    };
  });

  /* H2: a type that cannot state its own figure is not eligible to win the
     title. If no type clears the threshold the title falls back to the plain
     section name and the derived sentence does not render. */
  const eligible = rows.filter((r): r is ParTypeRow & { shotsPerRound: number } => r.shotsPerRound !== null);
  const dominant = eligible.sort((a, b) => b.shotsPerRound - a.shotsPerRound)[0] ?? null;

  /* 5B L1: the four bands come from the exact counts, not the pct_* fields.
     pct_par_better is par OR BETTER (over ≤ 0) — it includes every par — so
     deriving birdie-or-better from it overstated the band and drove the
     remainder-computed par band negative. The remainder and the clamp are
     gone (L2): the counts partition holes_played, so no band is computed as
     100 minus the others and a negative band is impossible by construction. */
  const hasCounts = present.every(
    (t) =>
      t.data.birdie_better_count != null &&
      t.data.par_count != null &&
      t.data.bogey_count != null &&
      t.data.double_count != null,
  );

  let bands: OutcomeBands | null = null;
  if (hasCounts) {
    const sum = (pick: (d: ParSplitInput) => number | undefined) =>
      present.reduce((s, t) => s + (pick(t.data) ?? 0), 0);
    const exact = {
      birdiePlus: (sum((d) => d.birdie_better_count) / totalHoles) * 100,
      par: (sum((d) => d.par_count) / totalHoles) * 100,
      bogey: (sum((d) => d.bogey_count) / totalHoles) * 100,
      doublePlus: (sum((d) => d.double_count) / totalHoles) * 100,
    };
    /* L2: round for display only, then if rounding leaves the four summing
       to 99 or 101, add the difference to the largest band so the bar
       fills exactly. */
    const entries = (Object.keys(exact) as Array<keyof OutcomeBands>).map((k) => ({
      key: k,
      value: Math.round(exact[k]),
    }));
    const drift = 100 - entries.reduce((s, e) => s + e.value, 0);
    if (drift !== 0) {
      const largest = entries.reduce((a, b) => (b.value > a.value ? b : a));
      largest.value += drift;
    }
    bands = {
      birdiePlus: entries.find((e) => e.key === 'birdiePlus')!.value,
      par: entries.find((e) => e.key === 'par')!.value,
      bogey: entries.find((e) => e.key === 'bogey')!.value,
      doublePlus: entries.find((e) => e.key === 'doublePlus')!.value,
    };
  }

  return {
    totalHoles,
    rows,
    dominant,
    bands,
  };
}

